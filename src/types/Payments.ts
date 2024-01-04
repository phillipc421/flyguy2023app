export interface CreatePaymentIntentDTO {
  products: { id: string; quantity: number }[];
}
