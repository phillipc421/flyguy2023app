import { PoolClient } from "pg";

import { DatabaseProduct } from "@/types/Product";

export async function getPrices(client: PoolClient) {
  const priceCache = new Map();
  const priceQuery = "SELECT id, current_price FROM products;";
  const { rows } = <{ rows: Pick<DatabaseProduct, "current_price" | "id">[] }>(
    await client.query(priceQuery)
  );
  rows.forEach((product) => {
    if (!priceCache.has(product.id)) {
      const price = Number(product.current_price.slice(1));
      priceCache.set(product.id, price);
    }
  });
  return priceCache;
}
