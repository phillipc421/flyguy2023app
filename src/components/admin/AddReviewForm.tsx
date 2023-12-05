import { DatabaseProduct } from "@/types/Product";
import styles from "./AddReviewForm.module.css";

export interface AddReviewFormProps {
  products: DatabaseProduct[];
}
export default function AddReviewForm({ products }: AddReviewFormProps) {
  return (
    <form
      action={"/api/admin"}
      method="POST"
      className={styles["form-container"]}
    >
      <div>
        <label htmlFor="review-product">Product</label>
        <select id="review-product" name="product">
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="review-reviewer">Reviewer</label>
        <input id="review-reviewer" name="reviewer"></input>
      </div>
      <div>
        <label htmlFor="review-review">Review</label>
        <textarea id="review-review" name="review"></textarea>
      </div>
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}
