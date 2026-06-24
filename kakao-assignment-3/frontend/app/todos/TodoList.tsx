"use client";

import { useRouter } from "next/navigation";

type Todo = {
  id: number;
  title: string;
  is_done: boolean;
};

export default function TodoList({ todos }: { todos: Todo[] }) {
  const router = useRouter();

  async function handleDelete(id: number) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleToggle(todo: Todo) {
    await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: todo.title, is_done: !todo.is_done }),
    });
    router.refresh();
  }

  if (todos.length === 0) {
  return <p className="text-gray-400 text-center mt-4">할 일이 없습니다 🎉</p>;
}

  return (
    <ul className="space-y-3">
      {todos.map((todo) => (
        <li key={todo.id} className="flex items-center justify-between border p-3 rounded">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={todo.is_done}
              onChange={() => handleToggle(todo)}
            />
            <span className={todo.is_done ? "line-through text-gray-400" : ""}>
              {todo.title}
            </span>
          </div>
          <div className="flex gap-2">
            <a href={`/todos/${todo.id}`} className="text-blue-500 text-sm">수정</a>
            <button
                onClick={() => handleDelete(todo.id)}
                className="text-red-500 text-sm cursor-pointer"
            >
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}