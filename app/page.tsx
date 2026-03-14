// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-blue-500 blur-3xl mix-blend-screen" />
        <div className="absolute top-40 -right-32 h-80 w-80 rounded-full bg-emerald-400 blur-3xl mix-blend-screen" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col gap-16 lg:flex-row lg:items-center">
        <section className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI‑powered ATS resume checker
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-50">
              Make your resume
              <span className="block bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                stand out to ATS
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl">
              Upload your resume and get an instant ATS score, keyword match against the job
              description, and actionable AI suggestions to improve your chances of getting shortlisted.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-slate-200">
            <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700">
              PDF parsing
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700">
              JD keyword match
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700">
              Gemini AI suggestions
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700">
              Per‑email history
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-400 hover:to-indigo-400 transition"
            >
              Start checking your resume
            </Link>
            <p className="text-xs sm:text-sm text-slate-400">
              No signup form. Your resume email automatically becomes your account.
            </p>
          </div>
        </section>

        <section className="flex-1">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
            <header className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.18em]">
                  Live demo
                </p>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                  How it works
                </h2>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                3 easy steps
              </span>
            </header>

            <ol className="space-y-3 text-sm text-slate-200">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-xs font-semibold text-slate-100">
                  1
                </span>
                <div>
                  <p className="font-semibold">Paste the job description.</p>
                  <p className="text-slate-400">
                    Tell the ATS what role you&apos;re targeting so we can detect missing keywords.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-xs font-semibold text-slate-100">
                  2
                </span>
                <div>
                  <p className="font-semibold">Upload your resume PDF.</p>
                  <p className="text-slate-400">
                    We safely extract text, detect your email, and link this resume to your account.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-xs font-semibold text-slate-100">
                  3
                </span>
                <div>
                  <p className="font-semibold">Review your ATS score & AI tips.</p>
                  <p className="text-slate-400">
                    See strengths, weaknesses, missing keywords, and concrete suggestions to boost your score.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-100">
              Your analyses are stored per email, so you can come back anytime and review your history.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}