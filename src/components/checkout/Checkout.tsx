"use client";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  AddressElement,
} from "@stripe/react-stripe-js";
import { getSession } from "next-auth/react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function ShippingDetails() {
  return (
    <>
      <h2>Shipping Info</h2>
      <AddressElement
        options={{
          mode: "shipping",
          allowedCountries: ["US"],
          autocomplete: { mode: "automatic" },
        }}
      ></AddressElement>
    </>
  );
}
function CheckoutForm({ orderId }: { orderId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  useEffect(() => {
    if (!stripe) return;
  }, [stripe]);
  const submitHandler = async () => {
    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `http://localhost:3000/orders/${orderId}`,
      },
    });
  };

  return (
    <>
      {" "}
      <PaymentElement
        id="payment-element"
        options={{ layout: "tabs" }}
      ></PaymentElement>
      <button onClick={submitHandler}>Submit</button>
    </>
  );
}
export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState(-1);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetcher = async () => {
      try {
        const session = await getSession();
        console.log("SESSION", session);
        if (!session) return;
        const cart = localStorage.getItem("cart");
        // convert to payment intent DTO
        const cartMap = JSON.parse(cart!) as { [key: string]: number };

        const products = Object.keys(cartMap).map((productId) => ({
          id: productId,
          quantity: cartMap[productId],
        }));
        const body = { products };

        const res = await fetch("/api/payments", {
          method: "POST",
          body: JSON.stringify(body),
          signal,
        });
        const data = await res.json();
        console.log(data);
        setClientSecret(data.client_secret);
        setOrderId(data.order_id);
      } catch (e) {
        console.error(e);
      }
    };
    fetcher();
    return () => controller.abort();
  }, []);

  return (
    <div>
      {clientSecret && (
        <Elements
          options={{ appearance: { theme: "stripe" }, clientSecret }}
          stripe={stripePromise}
        >
          <ShippingDetails></ShippingDetails>
          <CheckoutForm orderId={orderId}></CheckoutForm>
        </Elements>
      )}
    </div>
  );
}
