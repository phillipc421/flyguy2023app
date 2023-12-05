import { Product } from "@/types/Product";
import styles from "./ProductCard.module.css";

export interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className={styles["product-card"]}>
      <h2>{product.name}</h2>
      <p>
        <s>${product.price}</s> ${product.current_price}
      </p>
      <img src={product.photo_url} height={200} width={200}></img>
      <p>{product.description}</p>
      <button>Add To Cart</button>
    </article>
  );
}
