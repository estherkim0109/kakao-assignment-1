"use server";

const FASTAPI_URL = process.env.FASTAPI_URL;

export async function getTodos() {
  const res = await fetch(`${FASTAPI_URL}/todos`, { cache: "no-store" });
  if (!res.ok) throw new Error("Todo 목록을 불러오지 못했어요");
  return res.json();
}

export async function getTodo(id: string) {
  const res = await fetch(`${FASTAPI_URL}/todos/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Todo를 불러오지 못했어요");
  return res.json();
}