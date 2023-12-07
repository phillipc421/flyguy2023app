"use client";
import { useRouter } from "next/navigation";
import { DatabaseProduct } from "@/types/Product";
import styles from "./Product.module.css";

export interface ProductProps {
  product: DatabaseProduct;
}

export default function Product({ product }: ProductProps) {
  const router = useRouter();

  const { name, ...allOtherProperties } = product;
  const deleteHandler = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete product: " + name
    );
    if (!confirmed) return;
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      body: JSON.stringify({ id: product.id }),
    });
    const data = await res.json();
    if (data.message) router.refresh();
  };

  return (
    <article className={styles["product-container"]}>
      <h4>{name}</h4>
      <ul>
        {Object.entries(allOtherProperties).map(([property, value]) => (
          <li key={value}>
            {property}: {value}
          </li>
        ))}
      </ul>
      <button onClick={deleteHandler}>Delete</button>
    </article>
  );
}
