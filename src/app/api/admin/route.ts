import { NextResponse, NextRequest } from "next/server";

import { pool } from "../../../config/db";

// create review
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

// delete review
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) throw new Error("missing review id");
    const client = await pool.connect();
    await client.query("DELETE FROM reviews WHERE id = $1;", [id]);
    client.release();
    return NextResponse.json({ message: "Review deleted: " + id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e });
  }
}
