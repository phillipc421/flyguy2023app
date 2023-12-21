import { NextResponse, NextRequest } from "next/server";

import { FlyGuyErrorResponse } from "@/utils/errorResponse";

import { pool } from "../../../../config/db";

import { getPrices } from "@/utils/getPrices";
import { sumOrderItems } from "@/utils/sumOrderItems";

export interface OrdersDTO {
  orders: DatabaseOrder[];
}

export interface OrderDTO {
  items: OrderItemDTO[];
  id: number;
  order_date: string;
  customer_name: string;
  user_id: string;
  order_total: string;
}

export interface OrderItemDTO {
  product_name: string;
  quantity: string;
  item_total: string;
}

export interface DatabaseOrder {
  id: number;
  order_date: string;
  customer_name: string;
  user_id: string;
  order_total: string;
  product_name: string;
  quantity: string;
  item_total: string;
}

export interface CreateOrderDTO {
  user_id: string;
  customer_name: string;
  order_total: number;
  order_items: CreateOrderItemDTO[];
}

export interface CreateOrderItemDTO {
  id: string;
  quantity: number;
}

export async function GET(req: NextRequest) {
  try {
    const client = await pool.connect();
    const queryParams = req.nextUrl.searchParams;
    const orderId = queryParams.get("orderId");
    if (orderId) {
      const query =
        "SELECT orders.id, order_date, customer_name, user_id, order_total, name as product_name, quantity, order_item_total as item_total FROM orders JOIN order_items ON orders.id = order_items.order_id JOIN products ON order_items.product_id = products.id WHERE orders.id = $1";
      const { rows } = <{ rows: DatabaseOrder[] }>(
        await client.query(query, [orderId])
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { message: `No order with ID: ${orderId}` },
          { status: 404 }
        );
      }

      return NextResponse.json({ order: parseOrderDTO(rows) });
    }

    const query = "SELECT * FROM orders";
    const { rows } = await client.query(query);
    return NextResponse.json({ orders: rows });
  } catch (e) {
    return FlyGuyErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("++++++");
    console.log(body);
    const parsedBody = validateCreateOrderBody(body);
    if (!parsedBody) {
      return NextResponse.json(
        { message: "Invalid body format" },
        { status: 400 }
      );
    }

    //

    const client = await pool.connect();

    const { order_items } = parsedBody;

    // save prices to prevent repeat db calls;
    const priceCache = await getPrices(client);

    console.log(priceCache);

    // order items sum to the order total
    const orderItemsSum = sumOrderItems(order_items, priceCache);
    console.log(orderItemsSum, "order items sum");

    if (orderItemsSum !== parsedBody.order_total) {
      return NextResponse.json(
        {
          message:
            "Sum of order_items must be equal to the value for order_total",
        },
        { status: 400 }
      );
    }

    // database create

    const createQuery =
      "INSERT INTO orders (customer_name, user_id, order_total) VALUES ($1, $2, $3) RETURNING *;";

    const { rows } = <{ rows: DatabaseOrder[] }>(
      await client.query(createQuery, [
        parsedBody.customer_name,
        parsedBody.user_id,
        parsedBody.order_total,
      ])
    );

    const newOrder = rows[0];

    // build the arguments for the query
    // const { order_items } = parsedBody;
    const queryArgs = new Array();

    for (let i = 0; i < order_items.length; i++) {
      const item = order_items[i];
      const { id: productId, quantity } = item;

      const price = priceCache.get(productId);

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

    const { rows: orderItemRows } = await client.query(
      createOrderItemsQuery,
      queryArgs
    );

    const requestResult = {
      order: { ...newOrder, order_items: orderItemRows },
    };

    // TODO
    // handle errors like bad product id

    return NextResponse.json(
      { message: "Order created", ...requestResult },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return FlyGuyErrorResponse();
  }
}

// move the order_item values under their own "items" property
// this just takes the SQL results and creates a DTO object for the response
function parseOrderDTO(dbResults: DatabaseOrder[]): OrderDTO {
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

// make sure conforms to DTO standard
function validateCreateOrderBody(body: {
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
