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

export async function DELETE(req: NextRequest) {
  try {
    const queryParams = req.nextUrl.searchParams;
    const orderId = queryParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { message: "Missing order ID" },
        { status: 400 }
      );
    }
    const controller = new OrdersController(req);
    return await controller.deleteOrder(Number(orderId));
  } catch (e) {
    return FlyGuyErrorResponse();
  }
}
