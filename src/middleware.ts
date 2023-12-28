import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWT, getToken } from "next-auth/jwt";

export interface NextAuthTokenWithRole extends JWT {
  role: "admin" | "user" | null;
}

export async function middleware(req: NextRequest) {
  console.log("Middleware!!!!");
  // TODO
  // ecxplore WWW-Authenticate header for 403's
  console.log(await getToken({ req, raw: true }));
  const token = (await getToken({ req })) as NextAuthTokenWithRole;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (token.role !== "admin") {
    return NextResponse.json(
      { message: "You do not have access to this resource" },
      { status: 403 }
    );
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/api/admin/:path*",
};
