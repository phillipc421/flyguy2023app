import { NextResponse } from "next/server";
import { AuthService } from "./app/services/AuthService";
import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextMiddlewareWithAuth } from "next-auth/middleware";
import { getSession } from "next-auth/react";

import type { NextRequest } from "next/server";
import { NextAuthOptions, Session, getServerSession } from "next-auth";
import { nextAuthOptions } from "./app/api/auth/[...nextauth]/route";
import { JWT, getToken } from "next-auth/jwt";

export interface NextAuthTokenWithRole extends JWT {
  role: "admin" | "user" | null;
}

export async function middleware(req: NextRequest) {
  console.log("Middleware!!!!");
  const token = await getToken({ req });
  console.log(token);
}

// export default withAuth(async function middleware(
//   request: NextRequestWithAuth
// ) {
//   try {
//     console.log("middle ware runs, start auth service");
//     console.log(request.nextauth.token);
//     const token = request.nextauth.token as NextAuthTokenWithRole;
//     if (token.role !== "admin") {
//       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
//     }
//   } catch (e) {
//     console.error(e);
//     return NextResponse.next();
//   }
// });

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/api/admin/:path*",
};
