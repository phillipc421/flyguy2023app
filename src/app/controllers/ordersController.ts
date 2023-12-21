import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/config/db";
import { Pool, PoolClient } from "pg";
import {
  CreateOrderDTO,
  CreateOrderItemDTO,
  DatabaseOrder,
} from "../api/admin/orders/route";
import { DatabaseProduct } from "@/types/Product";

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

  private async clientRelease() {
    this.client.release();
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
      const newOrderItems = await this.createDBOrderItems(
        order_items,
        newOrder
      );

      await this.clientRelease();

      const response = {
        message: "Order Created",
        order: { ...newOrder, order_items: newOrderItems },
      };
      return NextResponse.json(response, { status: 201 });
    } catch (e) {
      console.error(this.createOrder.name, e);
    }
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
}
