"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

export default function Home() {
  const { register, handleSubmit, reset } = useForm();
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: formData.input }),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const parsedData = await response.json();
      setData(parsedData.data);
      reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="py-10 text-center">
        <h1 className="text-4xl font-bold mb-2">🚀 Browser Agent</h1>
        <p className="text-gray-400 text-lg">
          Interact with the browser through this simple agent form.
        </p>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-lg bg-gray-900/70 border border-gray-700 rounded-2xl shadow-lg p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <input
              autoComplete="off"
              type="text"
              placeholder="Type your command..."
              {...register("input", { required: true })}
              className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 transition-colors py-3 rounded-xl font-semibold text-lg shadow-md disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>

          <div className="mt-6">
            <span className="block px-4 py-3 rounded-xl bg-gray-800 border border-gray-700">
              {isLoading
                ? "Loading..."
                : error
                ? `❌ Error: ${error}`
                : data
                ? JSON.stringify(data, null, 2)
                : "No data yet"}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        © 2023 Browser Agent. All rights reserved.
      </footer>
    </div>
  );
}
