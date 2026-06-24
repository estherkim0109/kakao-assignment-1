import EditForm from "./EditForm";
import { getTodo } from "@/app/actions";

export default async function EditTodoPage({
  params,
}: {
  params: Promise<{ todoId: string }>;
}) {
  const { todoId } = await params;
  const todo = await getTodo(todoId);

  return (
    <main className="max-w-xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">Todo 수정</h1>
      <EditForm todo={todo} />
    </main>
  );
}