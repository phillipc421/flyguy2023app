import { NextRequest, NextResponse } from "next/server";

import { OrdersService } from "../services/OrdersService";
import { CreateOrderDTO } from "@/types/Orders";

/* TODO
/* handle guest orders (no user id)
*/

export class OrdersController {
  private ordersService: OrdersService;
  constructor(private req: NextRequest) {
    this.req = req;
    this.ordersService = new OrdersService();
  }

  public async getOrders() {
    try {
      const orders = await this.ordersService.getOrders();
      return NextResponse.json({ orders });
    } catch (e) {
      console.error(this.getOrders.name, e);
      throw e;
    }
  }

  public async getOrder(orderId: string) {
    try {
      const order = await this.ordersService.getOrder(Number(orderId));
      return NextResponse.json({ order });
    } catch (e) {
      console.error(this.getOrder.name, e);
      throw e;
    }
  }

  public async createOrder() {
    try {
      // should the body parsing be a part of order service?
      const body = await this.req.json();
      const parsedBody = this.validateCreateOrderBody(body);
      if (!parsedBody) {
        return NextResponse.json(
          { message: "Invalid body format" },
          { status: 400 }
        );
      }
      const newOrder = await this.ordersService.createOrder(parsedBody);
      if (!newOrder) throw new Error("There was an error creating the order");

      const response = {
        message: "Order Created",
        order: newOrder,
      };

      return NextResponse.json(response, { status: 201 });
    } catch (e) {
      console.error(this.createOrder.name, e);
      throw e;
    }
  }

  public async deleteOrder(orderId: number) {
    try {
      const deletedOrder = await this.ordersService.deleteOrder(orderId);
      if (!deletedOrder)
        throw new Error("There was an error deleting the order");
      const response = {
        message: "Order Deleted",
        order: deletedOrder,
      };
      return NextResponse.json(response);
    } catch (e) {
      console.error(this.deleteOrder.name, e);
      throw e;
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
}
