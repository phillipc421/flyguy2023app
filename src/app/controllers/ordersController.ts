import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/config/db";
import { Pool, PoolClient } from "pg";
import {
  CreateOrderDTO,
  CreateOrderItemDTO,
  DatabaseOrder,
  OrderDTO,
} from "../api/admin/orders/route";
import { DatabaseProduct } from "@/types/Product";

/* TODO
/* Make sure product ids are valid
/* make sure user ids are valid
/* handle guest orders (no user id)
*/

export class OrdersController {
  private pool: Pool;
  private client!: PoolClient;
  private priceCache: Map<any, any>;
  constructor(private req: NextRequest) {
    this.req = req;
    this.pool = pool;
    this.priceCache = new Map();
  }

  private async connectClient() {
    this.client = await this.pool.connect();
  }

  private clientRelease() {
    this.client.release();
  }

  public async getOrders() {
    try {
      await this.connectClient();
      const query = "SELECT * FROM orders";
      const { rows } = await this.client.query(query);
      this.clientRelease();
      return NextResponse.json({ orders: rows });
    } catch (e) {
      console.error(this.getOrders.name, e);
      throw e;
    }
  }

  public async getOrder(orderId: string) {
    try {
      await this.connectClient();
      const query =
        "SELECT orders.id, order_date, customer_name, user_id, order_total, name as product_name, quantity, order_item_total as item_total FROM orders JOIN order_items ON orders.id = order_items.order_id JOIN products ON order_items.product_id = products.id WHERE orders.id = $1";
      const { rows } = <{ rows: DatabaseOrder[] }>(
        await this.client.query(query, [orderId])
      );

      this.clientRelease();

      if (rows.length === 0) {
        return NextResponse.json(
          { message: `No order with ID: ${orderId}` },
          { status: 404 }
        );
      }

      const order = this.parseOrderDTO(rows);

      return NextResponse.json({ order });
    } catch (e) {
      console.error(this.getOrder.name, e);
      throw e;
    }
  }

  public async createOrder() {
    try {
      await this.connectClient();
      const body = await this.req.json();
      const parsedBody = this.validateCreateOrderBody(body);
      if (!parsedBody) {
        return NextResponse.json(
          { message: "Invalid body format" },
          { status: 400 }
        );
      }

      const { order_items } = parsedBody;

      // save prices to prevent repeat db calls;
      await this.getPrices();

      // order items sum to the order total
      const orderItemsSum = this.sumOrderItems(order_items);

      if (orderItemsSum !== parsedBody.order_total) {
        return NextResponse.json(
          {
            message:
              "Sum of order_items must be equal to the value for order_total",
          },
          { status: 400 }
        );
      }

      const newOrder = await this.createDBOrder(parsedBody);
      if (!newOrder) throw new Error("Error creating order in DB");
      let newOrderItems = await this.createDBOrderItems(order_items, newOrder);
      if (!newOrderItems) {
        // delete the associated order
        await this.deleteOrder(newOrder.id);
        throw new Error("Error creating order items in DB");
      }
      this.clientRelease();

      const response = {
        message: "Order Created",
        order: { ...newOrder, order_items: newOrderItems },
      };
      return NextResponse.json(response, { status: 201 });
    } catch (e) {
      console.error(this.createOrder.name, e);
      throw e;
    }
  }

  private async deleteOrder(orderId: number) {
    const deleteQuery = "DELETE FROM orders WHERE id = $1;";
    await this.client.query(deleteQuery, [orderId]);
  }

  private async createDBOrder(parsedBody: CreateOrderDTO) {
    try {
      const createQuery =
        "INSERT INTO orders (customer_name, user_id, order_total) VALUES ($1, $2, $3) RETURNING *;";

      const { rows } = <{ rows: DatabaseOrder[] }>(
        await this.client.query(createQuery, [
          parsedBody.customer_name,
          parsedBody.user_id,
          parsedBody.order_total,
        ])
      );
      return rows[0];
    } catch (e) {
      console.error(this.createDBOrder.name, e);
    }
  }

  private async createDBOrderItems(
    orderItems: CreateOrderItemDTO[],
    newOrder: DatabaseOrder
  ) {
    try {
      // build the arguments for the query
      const queryArgs = new Array();

      for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        const { id: productId, quantity } = item;

        const price = this.priceCache.get(productId);

        queryArgs.push(newOrder.id, productId, quantity, quantity * price);
      }

      let createOrderItemsQuery =
        "INSERT INTO order_items (order_id, product_id, quantity, order_item_total) VALUES";

      for (let i = 0; i < queryArgs.length; i += 4) {
        createOrderItemsQuery +=
          i === queryArgs.length - 4
            ? ` ($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}) `
            : ` ($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}),`;
      }

      createOrderItemsQuery += "RETURNING *;";

      const { rows: orderItemRows } = await this.client.query(
        createOrderItemsQuery,
        queryArgs
      );

      return orderItemRows;
    } catch (e) {
      console.error(this.createDBOrderItems.name, e);
    }
  }

  // make sure conforms to DTO standard
  private validateCreateOrderBody(body: {
    [key: string]: any;
  }): CreateOrderDTO | null {
    const expectedProperties = [
      "user_id",
      "customer_name",
      "order_total",
      "order_items",
    ];
    for (let i = 0; i < expectedProperties.length; i++) {
      const property = expectedProperties[i];
      if (!body.hasOwnProperty(property)) {
        return null;
      }
      switch (property) {
        case "user_id":
        case "customer_name":
          if (typeof body[property] !== "string") {
            return null;
          }
          break;
        case "order_total":
          if (typeof body[property] !== "number") {
            return null;
          }
          break;
        case "order_items":
          // not an array
          if (!Array.isArray(body[property])) {
            return null;
          }
          for (let j = 0; j < body[property].length; j++) {
            const order_item = body[property][j];
            console.log(order_item);
            if (
              !(
                order_item.hasOwnProperty("id") &&
                typeof order_item["id"] === "string"
              )
            ) {
              return null;
            }
            console.log("order item id is a string");
            if (
              !(
                order_item.hasOwnProperty("quantity") &&
                typeof order_item["quantity"] === "number"
              )
            ) {
              return null;
            }
            console.log("order item quantity is a number");
          }
          break;
      }
    }
    // passed all checks, build dto object
    return expectedProperties.reduce((dto, curr) => {
      dto[curr] = body[curr];
      return dto;
    }, Object.create(null));
  }

  private async getPrices() {
    const priceQuery = "SELECT id, current_price FROM products;";
    const { rows } = <
      { rows: Pick<DatabaseProduct, "current_price" | "id">[] }
    >await this.client.query(priceQuery);
    rows.forEach((product) => {
      if (!this.priceCache.has(product.id)) {
        const price = Number(product.current_price.slice(1));
        this.priceCache.set(product.id, price);
      }
    });
  }

  private sumOrderItems(orderItems: CreateOrderItemDTO[]) {
    return orderItems.reduce(
      (sum, orderItem) =>
        (sum += this.priceCache.get(orderItem.id) * orderItem.quantity),
      0
    );
  }

  // move the order_item values under their own "items" property
  // this just takes the SQL results and creates a DTO object for the response
  private parseOrderDTO(dbResults: DatabaseOrder[]): OrderDTO {
    return dbResults.reduce((dto, curr) => {
      const { product_name, quantity, item_total, ...orderDetails } = curr;
      const itemEntry = { product_name, quantity, item_total };
      if (dto.items) {
        dto.items.push(itemEntry);
      } else {
        dto.items = [itemEntry];
      }
      return Object.assign(dto, orderDetails);
    }, Object.create(null));
  }
}
