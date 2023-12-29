import { NextResponse, NextRequest } from "next/server";

import { FlyGuyErrorResponse } from "@/utils/errorResponse";

import { OrdersController } from "@/app/controllers/ordersController";

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
