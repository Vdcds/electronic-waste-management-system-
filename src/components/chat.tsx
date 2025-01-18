"use client";

import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState<
    { role: string; content: string; id: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      role: "user",
      content: input,
      id: Date.now().toString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add initial AI message
    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: aiMessageId },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? { ...m, content: m.content + data.text }
                  : m
              )
            );
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full">
      <h1 className="text-center mt-12 text-2xl font-semibold">
        Gemini Chatbot
      </h1>
      <div className="flex flex-col gap-4 w-[90%] max-w-md py-8 mx-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`whitespace-pre-wrap ${
              m.role === "user" ? "text-right bg-slate-50 p-2 rounded-md" : ""
            }`}
          >
            {m.content}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 border"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
