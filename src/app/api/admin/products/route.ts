import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "../../auth/[...nextauth]/route";
import { AuthService } from "@/app/services/AuthService";

import { pool } from "../../../../config/db";

export async function GET(req: NextRequest) {
  try {
    // const authService = new AuthService(nextAuthOptions);
    // const isAdmin = await authService.isAdmin();
    // if (!isAdmin)
    //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM products;");
    return NextResponse.json({ rows });
  } catch (e) {
    console.log(e);
    return NextResponse.json(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const productName = formData.get("name");
    const productPrice = formData.get("price");
    const productOrigPrice = formData.get("current_price");
    const productPhotoUrl = formData.get("photo_url");
    const productDescription = formData.get("description");

    const insertionValues = [
      productName,
      productPrice,
      productOrigPrice,
      productPhotoUrl,
      productDescription,
    ];

    if (!insertionValues.every((property) => property)) {
      throw new Error("missing formData");
    }

    const client = await pool.connect();
    await client.query(
      "INSERT INTO products (name, price, current_price, photo_url, description) VALUES ($1, $2, $3, $4, $5);",
      insertionValues
    );
    client.release();
    return NextResponse.json({ message: "added product" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) throw new Error("missing product id");
    const client = await pool.connect();
    await client.query("DELETE FROM products WHERE id = $1;", [id]);
    client.release();
    return NextResponse.json({ message: "Product deleted: " + id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e });
  }
}
