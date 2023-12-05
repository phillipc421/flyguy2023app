// convert the DB 'money' types to js numbers - return new array as type Product

import { DatabaseProduct, Product } from "@/types/Product";

export function dbProductParse(dbProducts: DatabaseProduct[]): Product[] {
  return dbProducts.map((dbProduct) => {
    const numberPrice = Number(dbProduct.price.slice(1));
    const numberCurrentPrice = Number(dbProduct.current_price.slice(1));
    return {
      ...dbProduct,
      price: numberPrice,
      current_price: numberCurrentPrice,
    };
  });
}
