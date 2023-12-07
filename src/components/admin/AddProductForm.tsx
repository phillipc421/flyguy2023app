"use client";
import { useRouter } from "next/navigation";
import styles from "./AddSomethingForm.module.css";

export default function AddProductForm() {
  const router = useRouter();
  const submitHandler: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/products", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.message) router.refresh();
  };

  return (
    <form className={styles["form-container"]} onSubmit={submitHandler}>
      <div>
        <h3>Add Product</h3>
      </div>
      <div>
        <label htmlFor="product-name">Product Name</label>
        <input id="product-name" name="name" required></input>
      </div>
      <div>
        <label htmlFor="product-price">Original Price</label>
        <input id="product-price" name="price" required></input>
      </div>
      <div>
        <label htmlFor="product-current-price">Current Price</label>
        <input id="product-current-price" name="current_price" required></input>
      </div>
      <div>
        <label htmlFor="product-photo-url">Photo URL</label>
        <input
          id="product-photo-url"
          name="photo_url"
          type="url"
          required
        ></input>
      </div>
      <div>
        <label htmlFor="product-description">Description</label>
        <textarea
          id="product-description"
          name="description"
          required
        ></textarea>
      </div>
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
  );
}
