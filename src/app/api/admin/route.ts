import { NextResponse, NextRequest } from "next/server";

import { pool } from "../../../config/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const product = formData.get("product");
    const reviewer = formData.get("reviewer");
    const review = formData.get("review");

    if (!product || !reviewer || !review) {
      throw new Error("missing formData");
    }

    const client = await pool.connect();
    await client.query(
      "INSERT INTO reviews (product_id, reviewer, content) VALUES ($1, $2, $3);",
      [product, reviewer, review]
    );
    client.release();
  } catch (e) {
    console.error(e);
  }
  return Response.redirect(req.nextUrl.origin + "/admin", 303);
}
