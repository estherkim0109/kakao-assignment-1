"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <main className="max-w-xl mx-auto mt-10 p-4">
      <p className="text-red-500">에러 발생: {error.message}</p>
    </main>
  );
}