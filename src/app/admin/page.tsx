import { DatabaseProduct } from "@/types/Product";
import { pool } from "../../config/db";

import AddReviewForm from "@/components/admin/AddReviewForm";

export default async function AdminPage() {
  const client = await pool.connect();
  const products = (await client.query("SELECT id, name FROM products;"))
    .rows as DatabaseProduct[];
  client.release();
  return (
    <main>
      <h1>Admin Panel</h1>
      <section>
        <h2>Add Reviews</h2>
        <AddReviewForm products={products}></AddReviewForm>
      </section>
    </main>
  );
}
