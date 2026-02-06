import Link from "next/link";
import DocSearch from "@/components/DocSearch";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg text-[var(--foreground)]">
            Next.js Docs Search
          </Link>
          <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
            RAG-powered
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <section className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight mb-4">
            Search the Next.js docs using RAG
          </h1>
          <p className="text-[var(--muted)] text-lg leading-relaxed">
            Ask questions in plain English. We find the right docs and generate clear, sourced answers—no digging through pages.
          </p>
        </section>

        {/* Search */}
        <section className="mb-16">
          <DocSearch />
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto pt-12 border-t border-[var(--card-border)]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-6 text-center">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-semibold mx-auto mb-3">1</div>
              <p className="text-sm font-medium text-[var(--foreground)]">You ask a question</p>
              <p className="text-sm text-[var(--muted)] mt-1">Short or long—we expand vague queries automatically.</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-semibold mx-auto mb-3">2</div>
              <p className="text-sm font-medium text-[var(--foreground)]">We search by meaning</p>
              <p className="text-sm text-[var(--muted)] mt-1">Embeddings find the most relevant doc chunks, not just keywords.</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-semibold mx-auto mb-3">3</div>
              <p className="text-sm font-medium text-[var(--foreground)]">You get an answer + sources</p>
              <p className="text-sm text-[var(--muted)] mt-1">GPT writes a clear answer from those chunks, with links to sources.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-[var(--muted)] border-t border-[var(--card-border)]">
        Built with Next.js, OpenAI embeddings, and Supabase vector search.
      </footer>
    </div>
  );
}
