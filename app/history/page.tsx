"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ResumeRecord {
  id: string;
  fileName: string;
  atsScore: number;
  createdAt: string;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  jobDescription?: string;
  name?: string;
  email?: string;
  skills?: string[];
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : score >= 40
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-red-400 bg-red-500/10 border-red-500/30";
  const label =
    score >= 70 ? "Good" : score >= 40 ? "Fair" : "Poor";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${color}`}>
      {score}/100
      <span className="text-xs font-medium opacity-75">{label}</span>
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "from-emerald-500 to-teal-400" : score >= 40 ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";

  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [history, setHistory] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(`/api/history?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
        else setError("Failed to load history.");
      })
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, [email]);

  const averageScore =
    history.length > 0
      ? Math.round(history.reduce((s, r) => s + r.atsScore, 0) / history.length)
      : 0;

  const best = history.length > 0 ? Math.max(...history.map((r) => r.atsScore)) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => router.push("/upload")}
            className="text-sm border border-slate-700 rounded-lg px-4 py-2 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
          >
            Upload New Resume
          </button>
        </div>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Resume History
          </div>
          <h1 className="text-3xl font-bold text-slate-50">Your Resume History</h1>
          {email && (
            <p className="mt-1 text-sm text-slate-400 break-all">{email}</p>
          )}
        </div>

        {/* Stats row */}
        {!loading && history.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Resumes Analyzed", value: history.length },
              { label: "Average Score", value: `${averageScore}/100` },
              { label: "Best Score", value: `${best}/100` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
                <p className="text-2xl font-bold text-slate-50">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-300">
            {error}
          </div>
        ) : !email ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
            <p className="text-slate-400 text-sm">No email provided. Please access this page from your ATS results.</p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-3">
            <p className="text-3xl">📄</p>
            <p className="text-slate-200 font-semibold">No resumes found for this email</p>
            <p className="text-slate-400 text-sm">Upload and analyze your first resume to see it here.</p>
            <button
              onClick={() => router.push("/upload")}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-white text-sm font-semibold px-5 py-2"
            >
              Upload Resume →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all duration-200 hover:border-slate-700"
              >
                {/* Row */}
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {item.fileName || "Resume"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ScoreBadge score={item.atsScore} />
                      <span className="text-slate-600 text-xs">{expanded === item.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ScoreBar score={item.atsScore} />
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === item.id && (
                  <div className="border-t border-slate-800 px-5 pb-5 pt-4 space-y-4">

                    {item.jobDescription && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Job Description</p>
                        <p className="text-sm text-slate-400 line-clamp-3">{item.jobDescription}</p>
                      </div>
                    )}

                    {(item.strengths || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {item.strengths.slice(0, 4).map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(item.improvements || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">Top Improvements</p>
                        <ul className="space-y-1">
                          {item.improvements.slice(0, 3).map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-amber-400 flex-shrink-0 mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(item.missingKeywords || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Missing Keywords ({item.missingKeywords.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.missingKeywords.slice(0, 12).map((kw, i) => (
                            <span key={i} className="bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs px-2 py-0.5 rounded-full">
                              {kw}
                            </span>
                          ))}
                          {item.missingKeywords.length > 12 && (
                            <span className="text-xs text-slate-500 self-center">+{item.missingKeywords.length - 12} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
