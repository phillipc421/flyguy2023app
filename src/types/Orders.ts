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

export interface DatabaseOrderFull {
  id: number;
  order_date: string;
  customer_name: string;
  user_id: string;
  order_total: string;
  status: "new" | "paid" | "canceled" | "fulfilled";
}

export interface DatabaseOrderWithItems {
  id: number;
  order_date: string;
  customer_name: string;
  user_id: string;
  order_total: string;
  product_name: string;
  quantity: string;
  item_total: string;
}

export interface DatabaseOrderItem {
  id: string;
  order_id: number;
  product_id: string;
  quantity: number;
  order_item_total: string;
}

export interface NewOrderDTO extends DatabaseOrderFull {
  order_items: DatabaseOrderItem[];
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
