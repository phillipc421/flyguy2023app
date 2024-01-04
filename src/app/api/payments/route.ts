import { CreatePaymentIntentDTO } from "@/types/Payments";
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import Stripe from "stripe";
import { DatabaseProduct } from "@/types/Product";
import { FlyGuyErrorResponse } from "@/utils/errorResponse";
import { JWT, getToken } from "next-auth/jwt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function calcPrices(
  clientProducts: { id: string; quantity: number }[],
  dbPrices: Pick<DatabaseProduct, "id" | "current_price">[]
) {
  console.log("DB PRICES", dbPrices);
  let total = 0;
  for (let i = 0; i < clientProducts.length; i++) {
    const { id, quantity } = clientProducts[i];
    console.log(id, quantity);
    const clientProduct = dbPrices.find((dbItem) => dbItem.id === id);
    if (!clientProduct) throw new Error("Invalid product ID");
    total += Number(clientProduct.current_price.slice(1)) * quantity;
  }
  // stripe reads in the smallest currency unit
  return total * 100;
}

// create stripe payment intent
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    console.log("HAHAHA", token);
    console.log("WE GOT THE POST");
    const { products } = <CreatePaymentIntentDTO>await req.json();
    if (!products) return NextResponse.json({ message: "Missing products" });
    console.log("PRODUCTS", products);
    // TODO make product service
    const dbClient = await pool.connect();
    const priceQuery = "SELECT id, current_price FROM products;";
    const { rows } = <
      { rows: Pick<DatabaseProduct, "id" | "current_price">[] }
    >await dbClient.query(priceQuery);

    const orderTotal = calcPrices(products, rows);
    console.log(orderTotal);

    const flyguyUserId = req.headers.get("flyuser");
    console.log(flyguyUserId);

    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: orderTotal,
      currency: "usd",
    };

    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentOptions
    );

    dbClient.release();

    return NextResponse.json({ client_secret: paymentIntent.client_secret });
  } catch (e) {
    console.error(e);
    return FlyGuyErrorResponse();
  }
}
