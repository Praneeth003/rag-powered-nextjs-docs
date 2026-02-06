"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Chunk = {
  id: string;
  title: string | null;
  description: string | null;
  similarity: number;
};

type Result = {
  answer: string;
  chunks: Chunk[];
};

export default function DocSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setStatus("loading");
    setResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong.");
        return;
      }

      if (data.error) {
        setStatus("error");
        setErrorMessage(data.suggestion ? `${data.error} ${data.suggestion}` : data.error);
        return;
      }

      setResult({ answer: data.answer, chunks: data.chunks || [] });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What is Server-Side Rendering?"
          className="flex-1 px-4 py-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent shadow-[var(--shadow)]"
          disabled={status === "loading"}
          autoFocus
        />
        <button
          type="submit"
          disabled={status === "loading" || !query.trim()}
          className="px-6 py-3 rounded-[var(--radius)] bg-[var(--accent)] text-white font-medium cursor-pointer hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      {status === "loading" && (
        <div className="mt-8 flex flex-col items-center gap-3 text-[var(--muted)]">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p>Searching docs and generating an answer…</p>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-8 p-4 rounded-[var(--radius)] bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-10 space-y-8">
          <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">Answer</h2>
            <div className="prose-doc text-[var(--foreground)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
            </div>
          </section>

          {result.chunks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Sources</h2>
              <ul className="space-y-2">
                {result.chunks.map((chunk) => (
                  <li
                    key={chunk.id}
                    className="flex items-start gap-3 p-3 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow)]"
                  >
                    <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center text-xs font-semibold">
                      {(chunk.similarity * 100).toFixed(0)}%
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)]">
                        {chunk.title || chunk.id}
                      </p>
                      {chunk.description && (
                        <p className="text-sm text-[var(--muted)] mt-0.5">{chunk.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
