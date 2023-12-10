"use client";
import { signIn } from "next-auth/react";

export default function SignInBtn() {
  return <button onClick={() => signIn()}>SignIn</button>;
}
