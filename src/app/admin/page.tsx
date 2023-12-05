import { DatabaseProduct } from "@/types/Product";
import { DatabaseReview } from "@/types/Review";
import { pool } from "../../config/db";

import AddReviewForm from "@/components/admin/AddReviewForm";
import ReviewsList from "@/components/admin/ReviewsList";

export default async function AdminPage() {
  const client = await pool.connect();
  const products = (await client.query("SELECT id, name FROM products;"))
    .rows as DatabaseProduct[];
  const reviews = (await client.query("SELECT * FROM reviews;"))
    .rows as DatabaseReview[];
  client.release();
  return (
    <main>
      <h1>Admin Panel</h1>
      <section>
        <h2>Add Reviews</h2>
        <AddReviewForm products={products}></AddReviewForm>
        <ReviewsList reviews={reviews}></ReviewsList>
      </section>
    </main>
  );
}
