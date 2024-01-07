import { CreateOrderItemDTO } from "@/app/api/orders/route";

export function sumOrderItems(
  orderItems: CreateOrderItemDTO[],
  prices: Map<any, any>
) {
  return orderItems.reduce(
    (sum, orderItem) => (sum += prices.get(orderItem.id) * orderItem.quantity),
    0
  );
}
