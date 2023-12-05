export interface DatabaseProduct {
  id: string;
  name: string;
  price: string;
  current_price: string;
  photo_url: string;
  description: string;
}

export interface Product
  extends Omit<DatabaseProduct, "price" | "current_price"> {
  price: number;
  current_price: number;
}
