"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    // Fetch user's resume history
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

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

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        window.localStorage.removeItem("atsOptimizedResult");
        window.localStorage.setItem(
          "atsResumeUpload",
          JSON.stringify({
            base64,
            jobDescription,
            fileName: file.name,
          })
        );
        router.push("/ats-score");
      };
      reader.onerror = () => {
        setError("Failed to read the PDF file.");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  const handleHistoryClick = (resumeData: any) => {
    // You can implement history navigation here
    console.log("Clicked history item:", resumeData);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Resume ATS Optimizer
          </div>
          <h1 className="text-4xl font-bold text-slate-50">Dashboard</h1>
          <p className="mt-2 text-slate-300">
            Upload your resume and optimize it for ATS systems to increase your chances of getting shortlisted.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description Upload */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">Paste Job Description</h2>
              <p className="text-sm text-slate-300 mb-6">
                Provide a job description to get tailored ATS optimization suggestions.
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job description here..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Resume Upload */}
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40">
              <h2 className="text-2xl font-bold text-slate-50 mb-2">Upload Your Resume</h2>
              <p className="text-sm text-slate-300 mb-6">
                Upload a PDF resume to analyze and optimize for ATS compatibility.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-3">Resume (PDF only)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 p-8 text-center hover:border-blue-500/50 transition">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-slate-300">
                        Click to upload or drag and drop your PDF resume
                      </p>
                      <p className="text-xs text-slate-400 mt-2">Maximum file size: 5MB</p>
                    </div>
                  </div>
                  {file && <p className="mt-3 text-sm text-emerald-200">✓ Selected: {file.name}</p>}
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Generating..." : "Generate ATS Resume"}
                </button>
              </div>
            </form>
          </div>

          {/* History Sidebar */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/40 h-fit">
            <h2 className="text-xl font-bold text-slate-50 mb-2">Resume History</h2>
            <p className="text-sm text-slate-300 mb-6">
              Your previously scanned resumes and scores.
            </p>

            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No resumes analyzed yet.</p>
                <p className="text-xs mt-2">Upload your first resume to get started!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left rounded-lg bg-slate-800/70 border border-slate-700 p-3 hover:border-emerald-500/50 hover:bg-slate-800 transition"
                  >
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {item.fileName || "Resume"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-emerald-400">
                        {item.atsScore}/100
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
