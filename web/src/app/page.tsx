import Link from "next/link";
import DocSearch from "@/components/DocSearch";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold text-3xl text-[var(--foreground)]">
              Next.js Docs Search
            </Link>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
              RAG-powered
            </span>
          </div>
          <ThemeSwitcher />
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
        <p className="inline-flex flex-wrap items-center justify-center gap-1.5">
          Built by{" "}
          <a
            href="https://github.com/Praneeth003"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            aria-label="Praneeth003 on GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Praneeth003
          </a>
          {" "}using Next.js, OpenAI Embeddings and Supabase Vector search.
        </p>
      </footer>
    </div>
  );
}
