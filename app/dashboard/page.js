// app/dashboard/page.js
"use client";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Restore last used email from localStorage (per-browser account)
    try {
      const stored = window.localStorage.getItem("atsUserEmail");
      if (stored) {
        setUserEmail(stored);
        fetchHistory(stored).finally(() => setInitialLoading(false));
        return;
      }
    } catch {
      // ignore storage errors
    }
    fetchHistory().finally(() => setInitialLoading(false));
  }, []);

  const fetchHistory = async (emailOverride) => {
    const emailToUse = emailOverride || userEmail;
    if (!emailToUse) {
      setHistory([]);
      return;
    }
    const res = await fetch(`/api/history?email=${encodeURIComponent(emailToUse)}`);
    if (res.ok) {
      const data = await res.json();
      setHistory(data);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(res.ok ? "Invalid response" : text.slice(0, 200) || "Analysis failed");
      }
      if (data.success) {
        setCurrentResult(data.analysis);
        if (data.userEmail) {
          setUserEmail(data.userEmail);
          try {
            window.localStorage.setItem("atsUserEmail", data.userEmail);
          } catch {
            // ignore
          }
          fetchHistory(data.userEmail);
        } else {
          fetchHistory();
        }
      } else {
        setError(data.error || "Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applySampleJobDescription = () => {
    setJobDescription(
      "We are looking for a Software Engineer with strong experience in React, Next.js, TypeScript, REST APIs, SQL/NoSQL databases, Docker, and cloud deployment. Experience with system design, testing, and CI/CD is a plus."
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-30">
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-blue-500 blur-3xl mix-blend-screen" />
        <div className="absolute top-40 -right-32 h-80 w-80 rounded-full bg-emerald-400 blur-3xl mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-10 px-4 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">ATS Resume Dashboard</h1>
            <p className="text-slate-300 mt-1 text-sm sm:text-base">
              Upload your resume and get ATS score, missing keywords, and AI suggestions.
            </p>
          </div>
          {userEmail && (
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium">Signed in as</span>
              <span className="truncate max-w-[10rem] sm:max-w-xs text-slate-100">{userEmail}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)] gap-8 lg:gap-10 max-w-6xl mx-auto">
        {/* Upload Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl shadow-black/40 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-2 text-slate-50">Analyze New Resume</h2>
          <p className="text-sm text-slate-300 mb-6">
            Upload a PDF. Optionally paste a job description to get missing keywords and targeted suggestions.
          </p>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-100">
                  Job description (optional)
                </label>
                <button
                  type="button"
                  onClick={applySampleJobDescription}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Use sample JD
                </button>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                placeholder="Paste the job description here (recommended for better keyword matching)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-400/60 border-dashed rounded-xl cursor-pointer bg-slate-900/70 hover:bg-slate-900 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-slate-100 font-semibold">Click to upload PDF</p>
                <p className="text-xs text-slate-400">Max size: 5MB</p>
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            {file && <p className="text-sm text-center text-slate-200 font-medium">{file.name}</p>}

            <button
              disabled={!file || loading}
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 transition shadow-lg shadow-blue-500/30"
            >
              {loading ? "AI is Scanning..." : "Generate ATS Report"}
            </button>
          </form>

          {/* Current Results */}
          {currentResult && (
            <div className="mt-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/70">
              {(() => {
                const score =
                  typeof currentResult.atsScore === "number"
                    ? currentResult.atsScore
                    : typeof currentResult.score === "number"
                      ? currentResult.score
                      : 0;
                const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
                return (
                  <>
                    <div className="flex items-end justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-50">ATS Score</h3>
                        <p className="text-sm text-slate-300">
                          Based on keyword match, structure, and overall clarity.
                        </p>
                      </div>
                      <div className="text-3xl font-black text-blue-300">{safeScore}/100</div>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${safeScore}%` }}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <p className="font-bold text-slate-50 mb-2">Strengths</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-200">
                    {(currentResult.strengths || []).slice(0, 6).map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <p className="font-bold text-slate-50 mb-2">Improvements</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-200">
                    {(currentResult.improvements || []).slice(0, 6).map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <p className="font-bold text-slate-50 mb-2">Missing keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {(currentResult.missingKeywords || []).slice(0, 30).map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 border border-orange-100"
                      >
                        {kw}
                      </span>
                    ))}
                    {(currentResult.missingKeywords || []).length === 0 && (
                      <p className="text-slate-200">None detected.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <p className="font-bold text-slate-50 mb-2">Matched keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {(currentResult.matchedKeywords || []).slice(0, 30).map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-100"
                      >
                        {kw}
                      </span>
                    ))}
                    {(currentResult.matchedKeywords || []).length === 0 && (
                      <p className="text-slate-200">
                        Add a job description to see matched keywords.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {Array.isArray(currentResult.suggestions) && currentResult.suggestions.length > 0 && (
                <div className="mt-6 rounded-xl bg-slate-900/80 border border-slate-700 p-4">
                  <p className="font-bold text-slate-50 mb-3">AI suggestions</p>
                  <ul className="space-y-3">
                    {currentResult.suggestions.slice(0, 8).map((s, idx) => {
                      if (typeof s === "string") {
                        return (
                          <li key={idx} className="text-sm text-slate-200">
                            {s}
                          </li>
                        );
                      }
                      return (
                        <li key={idx} className="text-sm">
                          <p className="font-semibold text-slate-50">{s.title}</p>
                          <p className="text-slate-200">{s.detail}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl shadow-black/40 p-6 sm:p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-2 text-slate-50">Your Analysis History</h2>
          <p className="text-xs text-slate-400 mb-4">
            We group your previous reports by the email detected in your resume.
          </p>
          <div className="space-y-4">
            {initialLoading ? (
              <p className="text-slate-400">Loading history…</p>
            ) : history.length === 0 ? (
              <p className="text-slate-400">No resumes analyzed yet.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setCurrentResult({
                      atsScore: item.atsScore,
                      strengths: item.strengths,
                      improvements: item.improvements,
                      missingKeywords: item.missingKeywords,
                      matchedKeywords: [],
                      suggestions: item.suggestions || [],
                    })
                  }
                  className="w-full text-left p-4 border border-slate-800 bg-slate-900/80 hover:bg-slate-900 rounded-lg flex justify-between items-center transition"
                >
                  <div>
                    <p className="font-semibold text-slate-100 truncate max-w-[14rem]">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-blue-300">{item.atsScore}/100</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}