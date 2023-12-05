import { DatabaseProduct } from "@/types/Product";
import { client } from "../config/db";
import { dbProductParse } from "@/utils/dbProductParse";
export default async function Home() {
  await client.connect();
  const res = (await client.query("SELECT * FROM products;"))
    .rows as DatabaseProduct[];
  await client.end();
  console.log(dbProductParse(res));
  return (
    <main>
      <h1>Hi</h1>
    </main>
  );
}
