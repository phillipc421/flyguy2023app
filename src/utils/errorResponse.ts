import { NextResponse } from "next/server";

export function FlyGuyErrorResponse(
  errorMessage: string = "Internal Server Error",
  status: number = 500
) {
  return NextResponse.json({ error: errorMessage }, { status });
}
