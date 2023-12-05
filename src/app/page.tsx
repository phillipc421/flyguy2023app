import { DatabaseProduct } from "@/types/Product";
import { pool } from "../config/db";
import { dbProductParse } from "@/utils/dbProductParse";
import ProductCard from "@/components/products/ProductCard";
export default async function Home() {
  const client = await pool.connect();
  const res = (await client.query("SELECT * FROM products;"))
    .rows as DatabaseProduct[];
  client.release();

  const products = dbProductParse(res);

  return (
    <main>
      <h1>Hi</h1>
      <section className="home-products">
        {products.map((product) => (
          <ProductCard product={product} key={product.id}></ProductCard>
        ))}
      </section>
    </main>
  );
}
