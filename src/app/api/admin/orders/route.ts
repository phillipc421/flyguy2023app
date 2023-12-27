import { NextResponse, NextRequest } from "next/server";

import { FlyGuyErrorResponse } from "@/utils/errorResponse";

import { OrdersController } from "@/app/controllers/ordersController";

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
    const queryParams = req.nextUrl.searchParams;
    const orderId = queryParams.get("orderId");
    const controller = new OrdersController(req);
    if (orderId) {
      return await controller.getOrder(orderId);
    }
    return await controller.getOrders();
  } catch (e) {
    console.error("it errored");
    return FlyGuyErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const controller = new OrdersController(req);
    return await controller.createOrder();
  } catch (e) {
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
