import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "./api/auth/[...nextauth]/route";
import { DatabaseProduct } from "@/types/Product";
import { pool } from "../config/db";
import { dbProductParse } from "@/utils/dbProductParse";
import ProductCard from "@/components/products/ProductCard";
import SignInBtn from "@/components/auth/SignInBtn";
export default async function Home() {
  const session = await getServerSession(nextAuthOptions);
  console.log("+++SESSION+++");
  console.log(session);
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
      <SignInBtn></SignInBtn>
    </main>
  );
}
