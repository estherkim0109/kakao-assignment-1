import Link from "next/link";
import TodoList from "./TodoList";
import { getTodos } from "@/app/actions";

export default async function TodosPage() {
  const todos = await getTodos();

  return (
    <main className="max-w-xl mx-auto mt-10 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Todo 목록</h1>
        <Link
          href="/todos/new"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + 새 Todo
        </Link>
      </div>
      <TodoList todos={todos} />
    </main>
  );
}