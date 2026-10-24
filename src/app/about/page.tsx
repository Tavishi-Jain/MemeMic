import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mic, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet the creators | MemeMic",
  description: "Meet Tavishi Jain and Atiksh Sharma, the creators of MemeMic.",
};

const creators = [
  {
    name: "Tavishi Jain",
    image: "/team/tavishi-jain.jpeg",
    description:
      "Co-creator of MemeMic, bringing everyday stories and playful AI experiences together.",
    linkedin: "https://www.linkedin.com/in/tavishi-jain-11895538a",
    accent: "from-[#fbbf24] to-[#f97316]",
  },
  {
    name: "Atiksh Sharma",
    image: "/team/atiksh-sharma.jpeg",
    description:
      "Co-creator of MemeMic, helping turn real-life moments into expressive, shareable comedy.",
    linkedin: "https://www.linkedin.com/in/atiksh-sharma-49b71437a",
    accent: "from-[#22d3ee] to-[#6366f1]",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between gap-4 rounded-[30px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#fbbf24]">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f97316] text-[#111827]">
              <Mic className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">MemeMic</span>
              <span className="block font-bold text-white">The creators</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#fbbf24]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to MemeMic
          </Link>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#fbbf24]/35 bg-[#fbbf24]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#fde68a]">
            <Sparkles className="h-4 w-4" />
            The people behind the mic
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">
            Meet the creators
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            We built MemeMic to give everyday chaos a punchline—and every good story a voice.
          </p>
          <p className="mt-6 bg-gradient-to-r from-[#fbbf24] via-[#fb923c] to-[#f472b6] bg-clip-text text-2xl font-extrabold text-transparent md:text-3xl">
            Two curious minds. One mic. Stories turned into punchlines.
          </p>
        </section>

        <section aria-label="MemeMic creators" className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          {creators.map((creator) => (
            <article
              key={creator.name}
              className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
            >
              <div className={`h-2 bg-gradient-to-r ${creator.accent}`} />
              <div className="p-5 md:p-7">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] bg-black/30">
                  <Image
                    src={creator.image}
                    alt={`${creator.name}, co-creator of MemeMic`}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">MemeMic co-creator</p>
                    <h2 className="mt-1 text-2xl font-bold text-white">{creator.name}</h2>
                  </div>
                  <a
                    href={creator.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${creator.name}'s LinkedIn profile (opens in a new tab)`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#fbbf24]"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4 text-[#60a5fa]"
                    >
                      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.26 2.37 4.26 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.44c.98 0 1.79-.77 1.79-1.73V1.73C24 .77 23.19 0 22.21 0h.01Z" />
                    </svg>
                    LinkedIn
                  </a>
                </div>
                <p className="mt-4 leading-7 text-zinc-300">{creator.description}</p>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-sm text-zinc-500">
          Made with imagination—and a mic that never misses a punchline.
        </footer>
      </div>
    </main>
  );
}
