import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL;

// GET /api/todos
export async function GET() {
  const res = await fetch(`${FASTAPI_URL}/todos`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data);
}

// POST /api/todos
export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${FASTAPI_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}