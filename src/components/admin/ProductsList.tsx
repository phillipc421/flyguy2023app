import { DatabaseProduct } from "@/types/Product";
import Product from "./Product";

export interface ProductsListProps {
  products: DatabaseProduct[];
}

export default function ProductsList({ products }: ProductsListProps) {
  return (
    <>
      <h3>Products List</h3>
      {products.map((product) => (
        <Product key={product.id} product={product}></Product>
      ))}
    </>
  );
}
