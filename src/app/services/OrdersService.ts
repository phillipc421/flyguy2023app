import { Pool, PoolClient } from "pg";
import { pool } from "@/config/db";
import { DatabaseProduct } from "@/types/Product";
import {
  CreateOrderDTO,
  CreateOrderItemDTO,
  DatabaseOrderFull,
  DatabaseOrderItem,
  DatabaseOrderWithItems,
  NewOrderDTO,
  OrderDTO,
} from "@/types/Orders";

export class OrdersService {
  private pool: Pool;
  private client!: PoolClient;
  private priceCache: Map<any, any>;
  private idList: Set<string>;
  constructor() {
    this.pool = pool;
    this.priceCache = new Map();
    this.idList = new Set();
  }

  private async initDb() {
    this.client = await this.pool.connect();
  }
  private async releaseDb() {
    this.client.release();
  }

  public async getOrders() {
    try {
      await this.initDb();
      const query = "SELECT * FROM orders";
      const { rows } = <{ rows: DatabaseOrderFull[] }>(
        await this.client.query(query)
      );

      return rows;
    } catch (e) {
      console.error(this.getOrders.name, e);
      throw e;
    } finally {
      this.releaseDb();
    }
  }

  public async getOrder(orderId: number) {
    try {
      await this.initDb();
      const query =
        "SELECT orders.id, order_date, customer_name, user_id, order_total, name as product_name, quantity, order_item_total as item_total FROM orders JOIN order_items ON orders.id = order_items.order_id JOIN products ON order_items.product_id = products.id WHERE orders.id = $1";
      const { rows } = <{ rows: DatabaseOrderWithItems[] }>(
        await this.client.query(query, [orderId])
      );

      const order = this.parseOrderDTO(rows);
      return order;
    } catch (e) {
    } finally {
      this.releaseDb();
    }
  }

  public async createOrder(
    orderBody: CreateOrderDTO
  ): Promise<NewOrderDTO | false | undefined> {
    try {
      await this.initDb();
      const { order_items } = orderBody;
      await this.getPricesAndIds();

      const validUserId = await this.validateUserId(orderBody.user_id);
      if (!validUserId) return false;

      const validProductIds = this.validateProductIds(order_items);
      if (!validProductIds) return false;

      const orderItemsSum = this.sumOrderItems(order_items);
      if (orderItemsSum !== orderBody.order_total) return false;

      const newOrder = await this.createDBOrder(orderBody);
      if (!newOrder) return false;

      const newOrderItems = await this.createDBOrderItems(
        order_items,
        newOrder
      );
      if (!newOrderItems) {
        await this.deleteDBOrder(newOrder.id);
        return false;
      }

      return { ...newOrder, order_items: newOrderItems };
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      this.releaseDb();
    }
  }

  public async deleteOrder(orderId: number) {
    try {
      await this.initDb();
      return await this.deleteDBOrder(orderId);
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      this.releaseDb();
    }
  }

  // move the order_item values under their own "items" property
  // this just takes the SQL results and creates a DTO object for the response
  private parseOrderDTO(dbResults: DatabaseOrderWithItems[]): OrderDTO {
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

  private async getPricesAndIds() {
    const priceQuery = "SELECT id, current_price FROM products;";
    const { rows } = <
      { rows: Pick<DatabaseProduct, "current_price" | "id">[] }
    >await this.client.query(priceQuery);
    rows.forEach((product) => {
      this.idList.add(product.id);
      if (!this.priceCache.has(product.id)) {
        const price = Number(product.current_price.slice(1));
        this.priceCache.set(product.id, price);
      }
    });
  }

  private async validateUserId(userId: string) {
    const userQuery = "SELECT * FROM users WHERE id = $1;";
    const { rows } = await this.client.query(userQuery, [userId]);
    if (rows.length === 0) {
      return false;
    }
    return true;
  }

  private validateProductIds(orderItems: CreateOrderItemDTO[]) {
    return orderItems.every((orderItem) => this.idList.has(orderItem.id));
  }

  private sumOrderItems(orderItems: CreateOrderItemDTO[]) {
    return orderItems.reduce(
      (sum, orderItem) =>
        (sum += this.priceCache.get(orderItem.id) * orderItem.quantity),
      0
    );
  }

  private async createDBOrder(parsedBody: CreateOrderDTO) {
    try {
      const createQuery =
        "INSERT INTO orders (customer_name, user_id, order_total) VALUES ($1, $2, $3) RETURNING *;";

      const { rows } = <{ rows: DatabaseOrderFull[] }>(
        await this.client.query(createQuery, [
          parsedBody.customer_name,
          parsedBody.user_id,
          parsedBody.order_total,
        ])
      );
      return rows[0];
    } catch (e) {
      console.error(this.createDBOrder.name, e);
      return false;
    }
  }

  private async createDBOrderItems(
    orderItems: CreateOrderItemDTO[],
    newOrder: DatabaseOrderFull
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

      const { rows: orderItemRows } = <{ rows: DatabaseOrderItem[] }>(
        await this.client.query(createOrderItemsQuery, queryArgs)
      );

      return orderItemRows;
    } catch (e) {
      console.error(this.createDBOrderItems.name, e);
      return false;
    }
  }

  private async deleteDBOrder(orderId: number) {
    try {
      const deleteQuery = "DELETE FROM orders WHERE id = $1 RETURNING *;";
      const { rows } = <{ rows: DatabaseOrderFull[] }>(
        await this.client.query(deleteQuery, [orderId])
      );
      return rows[0];
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
