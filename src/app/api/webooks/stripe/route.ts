import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = "";
export async function POST(req: NextRequest) {
  console.log("WEBHOOK");
  const sig = req.headers.get("stripe-signature");
  const body = Buffer.from(await req.arrayBuffer());
  const event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  console.log(event);
  return NextResponse.json({});
}
