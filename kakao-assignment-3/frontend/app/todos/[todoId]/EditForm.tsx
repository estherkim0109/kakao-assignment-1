"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Todo = {
  id: number;
  title: string;
  is_done: boolean;
};

export default function EditForm({ todo }: { todo: Todo }) {
  const [title, setTitle] = useState(todo.title);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, is_done: todo.is_done }),
    });

    router.push("/todos");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-500 text-white py-2 rounded">
        저장
      </button>
    </form>
  );
}