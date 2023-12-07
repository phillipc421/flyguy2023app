import { DatabaseProduct } from "@/types/Product";
import { DatabaseReview } from "@/types/Review";
import { pool } from "../../config/db";

import AddReviewForm from "@/components/admin/AddReviewForm";
import ReviewsList from "@/components/admin/ReviewsList";
import AddProductForm from "@/components/admin/AddProductForm";
import ProductsList from "@/components/admin/ProductsList";

export default async function AdminPage() {
  const client = await pool.connect();
  const products = (await client.query("SELECT * FROM products;"))
    .rows as DatabaseProduct[];
  const reviews = (await client.query("SELECT * FROM reviews;"))
    .rows as DatabaseReview[];
  client.release();
  return (
    <main>
      <h1>Admin Panel</h1>
      <section className="admin-section">
        <h2>Reviews</h2>
        <AddReviewForm products={products}></AddReviewForm>
        <ReviewsList reviews={reviews}></ReviewsList>
      </section>
      <section className="admin-section">
        <h2>Products</h2>
        <AddProductForm></AddProductForm>
        <ProductsList products={products}></ProductsList>
      </section>
    </main>
  );
}
