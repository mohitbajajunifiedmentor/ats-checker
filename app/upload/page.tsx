"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const SCAN_STEPS = [
  {
    id: 1,
    label: "Uploading Resume",
    desc: "Securely transmitting your document to our servers...",
    icon: "📤",
  },
  {
    id: 2,
    label: "Parsing PDF",
    desc: "Extracting text, structure, and formatting from your resume...",
    icon: "📄",
  },
  {
    id: 3,
    label: "Analyzing Content",
    desc: "Identifying skills, experience, education, and contact info...",
    icon: "🔍",
  },
  {
    id: 4,
    label: "Calculating ATS Score",
    desc: "Comparing keywords and scoring against job requirements...",
    icon: "📊",
  },
];

export default function UploadResumePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"form" | "scanning" | "finalizing">("form");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Refs to coordinate animation and API call without stale closure issues
  const apiResultRef = useRef<any>(null);
  const phaseRef = useRef<"form" | "scanning" | "finalizing">("form");

  const setPhaseSync = (p: "form" | "scanning" | "finalizing") => {
    phaseRef.current = p;
    setPhase(p);
  };

  const doRedirect = (result: any) => {
    window.localStorage.setItem(
      "atsAnalyzeResult",
      JSON.stringify({
        ...result,
        jobDescription: window.localStorage.getItem("atsJobDescription") || "",
      })
    );
    router.push("/ats-score");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please upload a PDF resume.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }

    // Store job description for later use
    window.localStorage.setItem("atsJobDescription", jobDescription);
    window.localStorage.removeItem("atsAnalyzeResult");

    // Kick off scanning phase
    setPhaseSync("scanning");
    setCurrentStep(1);
    setProgress(0);

    // Build FormData and call API in the background
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    fetch("/api/analyze", { method: "POST", body: formData })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          apiResultRef.current = result;
          // If animation already finished (finalizing state), redirect now
          if (phaseRef.current === "finalizing") {
            setProgress(100);
            setTimeout(() => doRedirect(result), 400);
          }
          // Otherwise animation will pick it up when it finishes
        } else {
          setError(result.error || "Analysis failed. Please try again.");
          setPhaseSync("form");
          setCurrentStep(0);
          setProgress(0);
        }
      })
      .catch(() => {
        setError("Failed to process resume. Please check your connection and try again.");
        setPhaseSync("form");
        setCurrentStep(0);
        setProgress(0);
      });
  };

  // Run the animation timeline when scanning starts
  useEffect(() => {
    if (phase !== "scanning") return;

    const steps = [
      { delay: 300,  step: 1, prog: 8 },
      { delay: 900,  step: 1, prog: 20 },
      { delay: 1800, step: 2, prog: 28 },
      { delay: 2600, step: 2, prog: 44 },
      { delay: 3500, step: 3, prog: 52 },
      { delay: 4400, step: 3, prog: 68 },
      { delay: 5300, step: 4, prog: 76 },
      { delay: 6200, step: 4, prog: 90 },
    ];

    const timeouts = steps.map(({ delay, step, prog }) =>
      setTimeout(() => {
        setCurrentStep(step);
        setProgress(prog);
      }, delay)
    );

    // After ~7s, animation is "done" — check if API is also done
    const finishTimeout = setTimeout(() => {
      setProgress(95);
      if (apiResultRef.current) {
        // API already returned — redirect
        setProgress(100);
        setTimeout(() => doRedirect(apiResultRef.current), 400);
      } else {
        // API still running — switch to finalizing state
        setPhaseSync("finalizing");
      }
    }, 7200);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finishTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Pulse progress bar while finalizing (waiting for API)
  useEffect(() => {
    if (phase !== "finalizing") return;
    const interval = setInterval(() => {
      setProgress((p) => (p >= 98 ? 95 : p + 0.5));
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  /* ─────────────────────────────────────────
     SCANNING / FINALIZING VIEW
  ───────────────────────────────────────── */
  if (phase === "scanning" || phase === "finalizing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-50">Analyzing Your Resume</h1>
            <p className="mt-2 text-slate-400 text-sm">
              {phase === "finalizing"
                ? "Almost there — finalizing your results..."
                : "Please wait while we scan and analyze your document"}
            </p>
          </div>

          {/* Document scanner visual */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-xl scale-110 animate-pulse" />

              {/* Document */}
              <div className="relative w-44 h-60 rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                {/* Document content lines */}
                <div className="px-4 pt-5 space-y-2.5">
                  <div className="h-2 w-3/4 rounded bg-slate-700" />
                  <div className="h-1.5 w-full rounded bg-slate-800" />
                  <div className="h-1.5 w-5/6 rounded bg-slate-800" />
                  <div className="h-1.5 w-4/5 rounded bg-slate-800" />
                  <div className="h-px w-full bg-slate-700/50 my-2" />
                  <div className="h-1.5 w-full rounded bg-slate-800" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-800" />
                  <div className="h-1.5 w-5/6 rounded bg-slate-800" />
                  <div className="h-px w-full bg-slate-700/50 my-2" />
                  <div className="h-1.5 w-full rounded bg-slate-800" />
                  <div className="h-1.5 w-2/3 rounded bg-slate-800" />
                </div>

                {/* Scanning beam */}
                <div
                  className="absolute left-0 right-0 h-0.5 pointer-events-none"
                  style={{
                    top: `${Math.min(progress, 98)}%`,
                    background:
                      "linear-gradient(90deg, transparent, rgba(52,211,153,0.9), transparent)",
                    boxShadow: "0 0 12px 4px rgba(52, 211, 153, 0.4)",
                    transition: "top 0.6s ease-in-out",
                  }}
                />

                {/* Top shimmer */}
                <div
                  className="absolute left-0 right-0 h-8 pointer-events-none"
                  style={{
                    top: `${Math.max(0, Math.min(progress, 98) - 8)}%`,
                    background:
                      "linear-gradient(180deg, transparent, rgba(52,211,153,0.06), transparent)",
                    transition: "top 0.6s ease-in-out",
                  }}
                />
              </div>

              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br" />
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-2 mb-8">
            {SCAN_STEPS.map((step) => {
              const isActive = currentStep === step.id && phase !== "finalizing";
              const isDone = currentStep > step.id || phase === "finalizing";

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-500 ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                      : isDone
                      ? "border-emerald-800/40 bg-slate-900/40"
                      : "border-slate-800 bg-transparent opacity-30"
                  }`}
                >
                  {/* Icon / Checkmark */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isActive
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-slate-800 text-slate-600"
                    }`}
                  >
                    {isDone ? "✓" : step.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        isDone
                          ? "text-emerald-400"
                          : isActive
                          ? "text-emerald-300"
                          : "text-slate-600"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{step.desc}</p>
                    )}
                  </div>

                  {isActive && (
                    <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  )}
                </div>
              );
            })}

            {/* Finalizing row */}
            {phase === "finalizing" && (
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-blue-500/40 bg-blue-500/10 shadow-md">
                <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-300">
                  ✨
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-300">Finalizing Results</p>
                  <p className="text-xs text-slate-400 mt-0.5">Generating your ATS score and insights...</p>
                </div>
                <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>
                {phase === "finalizing" ? "Finalizing analysis..." : "Scanning document..."}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #10b981, #14b8a6)",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────
     UPLOAD FORM VIEW
  ───────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <a href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-8">
          ← Back to Home
        </a>

        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-8 md:p-10 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered Analysis
            </div>
            <h1 className="text-3xl font-bold text-slate-50">Check My Resume</h1>
            <p className="mt-2 text-slate-400 text-sm leading-relaxed">
              Upload your PDF resume and paste a job description to receive a detailed ATS score,
              keyword analysis, and an AI-enhanced resume tailored to the role.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Job Description
                <span className="ml-2 text-xs font-normal text-slate-500">(recommended for best results)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job description here — we'll match your resume keywords against it and calculate an accurate ATS score..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Resume <span className="text-xs font-normal text-slate-500">(PDF only, max 5MB)</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : file
                    ? "border-emerald-600/60 bg-emerald-500/5"
                    : "border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/40"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const dropped = e.dataTransfer.files[0];
                  if (dropped) setFile(dropped);
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="text-center">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm font-semibold text-emerald-400">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-2 text-slate-600">📁</div>
                    <p className="text-sm text-slate-400">
                      Drag & drop your PDF here, or <span className="text-emerald-400 font-semibold">browse</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-1">PDF format only</p>
                  </div>
                )}
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/40 transition-all duration-200 active:scale-[0.98]"
            >
              Check My Resume →
            </button>

            <p className="text-xs text-center text-slate-600">
              Your data is analyzed securely and stored to power your resume history.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
