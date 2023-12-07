"use client";
import { DatabaseProduct } from "@/types/Product";
import { useRouter } from "next/navigation";
import styles from "./AddSomethingForm.module.css";

export interface AddReviewFormProps {
  products: DatabaseProduct[];
}
export default function AddReviewForm({ products }: AddReviewFormProps) {
  const router = useRouter();
  const submitHandler: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.message) router.refresh();
  };
  return (
    <form className={styles["form-container"]} onSubmit={submitHandler}>
      <div>
        <h3>Add Review</h3>
      </div>
      <div>
        <label htmlFor="review-product">Product</label>
        <select id="review-product" name="product" required>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="review-reviewer">Reviewer</label>
        <input id="review-reviewer" name="reviewer" required></input>
      </div>
      <div>
        <label htmlFor="review-review">Review</label>
        <textarea id="review-review" name="review" required></textarea>
      </div>
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}
