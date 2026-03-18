"use client";

export default function KeywordAnalysis({ data, matchedKeywords: directMatched, missingKeywords: directMissing }) {
  // Support both direct props (new flow) and nested data object (old flow)
  const matchedKeywords = directMatched ?? data?.optimized?.matchedKeywords ?? data?.original?.matchedKeywords ?? [];
  const missingKeywords = directMissing ?? data?.optimized?.missingKeywords ?? data?.original?.missingKeywords ?? [];

  if (!matchedKeywords.length && !missingKeywords.length) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40">
      <h2 className="text-2xl font-bold text-slate-50 mb-6">Keyword Analysis</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Matched Keywords */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-emerald-400">✓ Matched Keywords</h3>
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-200 text-sm font-bold">
              {matchedKeywords.length}
            </span>
          </div>
          <div className="bg-slate-900/50 rounded-2xl border border-emerald-500/20 p-4 min-h-[200px]">
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.length > 0 ? (
                matchedKeywords.slice(0, 15).map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    ✓ {kw}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400">No keywords matched yet.</p>
              )}
            </div>
            {matchedKeywords.length > 15 && (
              <p className="text-xs text-slate-400 mt-3">
                +{matchedKeywords.length - 15} more keywords matched
              </p>
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-amber-400">⚠ Missing Keywords</h3>
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-500/20 text-amber-200 text-sm font-bold">
              {missingKeywords.length}
            </span>
          </div>
          <div className="bg-slate-900/50 rounded-2xl border border-amber-500/20 p-4 min-h-[200px]">
            <div className="flex flex-wrap gap-2">
              {missingKeywords.length > 0 ? (
                missingKeywords.slice(0, 15).map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-200"
                  >
                    ⚠ {kw}
                  </span>
                ))
              ) : (
                <p className="text-sm text-emerald-300">All keywords are covered!</p>
              )}
            </div>
            {missingKeywords.length > 15 && (
              <p className="text-xs text-slate-400 mt-3">
                +{missingKeywords.length - 15} more keywords missing
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-4">
          Keyword Match Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Matched</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{matchedKeywords.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Missing</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{missingKeywords.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Coverage</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {Math.round(
                (matchedKeywords.length / (matchedKeywords.length + missingKeywords.length)) * 100
              )}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
