"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// KeywordAnalysis import retained for potential future use
// import KeywordAnalysis from "@/components/KeywordAnalysis";
import ProfessionalResumeEditor from "@/components/ProfessionalResumeEditor";
import { uploadStore } from "@/app/upload-store";

/* ─────────────────────────────────────────────────────
   Animated score counter
───────────────────────────────────────────────────── */
function AnimatedScore({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || target === 0) return;
    ran.current = true;
    const dur = 1200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return <>{val}</>;
}

/* ─────────────────────────────────────────────────────
   Score ring SVG
───────────────────────────────────────────────────── */
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const trackColor = score >= 70 ? "#05432d" : score >= 40 ? "#451a03" : "#3b0d0d";

  return (
    <svg width={size} height={size} className="-rotate-90" style={{ filter: `drop-shadow(0 0 12px ${color}40)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={11} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={11}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}                   

/* ─────────────────────────────────────────────────────
   Grade status type (used by buildSections + results render)
───────────────────────────────────────────────────── */
type GradeStatus = "good" | "fair" | "poor" | "missing";

/* ─────────────────────────────────────────────────────
   Improvement card
───────────────────────────────────────────────────── */
function ImprovementCard({
  impact,
  title,
  description,
}: {
  impact: "High" | "Medium" | "Low";
  title: string;
  description: string;
}) {
  const colors: Record<string, string> = {
    High:   "border-red-500/30 bg-red-500/5 text-red-400",
    Medium: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    Low:    "border-blue-500/30 bg-blue-500/5 text-blue-400",
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex gap-4">
      <div className="flex-shrink-0">
        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${colors[impact]}`}>
          {impact}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Derive section grades from structured + analysis data
───────────────────────────────────────────────────── */
function buildSections(structuredData: any, analysis: any) {
  const sd  = structuredData || {};
  const an  = analysis || {};
  const ss  = an.sectionScores   || {};   // AI-provided section scores
  const sf  = an.sectionFeedback || {};   // AI-provided section feedback

  const grade = (s: number): GradeStatus => s >= 75 ? "good" : s >= 45 ? "fair" : s > 0 ? "poor" : "missing";

  /* ── Contact ── */
  const contactFields = ["name", "email", "phone", "address", "linkedin", "github", "portfolio"];
  const contactPresent = contactFields.filter((f) => sd[f] && sd[f].trim?.().length > 0);
  const contactScore   = ss.contact ?? Math.round((contactPresent.length / contactFields.length) * 100);
  const missingContact = contactFields.filter((f) => !sd[f] || !sd[f].trim?.().length);

  /* ── Summary ── */
  const summaryWords = sd.summary ? sd.summary.split(/\s+/).length : 0;
  const summaryScore = ss.summary ?? (!sd.summary ? 0 : summaryWords < 20 ? 35 : summaryWords < 40 ? 60 : 88);

  /* ── Experience ── */
  const expCount    = (sd.experience || []).length;
  const expWithDesc = (sd.experience || []).filter((e: any) => (e.description || "").length > 80).length;
  const expScore    = ss.experience ?? (expCount === 0 ? 0 : Math.min(97, Math.round((expWithDesc / expCount) * 70 + Math.min(expCount * 15, 30))));

  /* ── Education ── */
  const eduCount = (sd.education || []).length;
  const eduScore = ss.education ?? (eduCount === 0 ? 0 : 88);

  /* ── Skills ── */
  const skillCount = (sd.skills || []).length;
  const skillScore = ss.skills ?? Math.min(97, skillCount * 8);

  /* ── Keywords ── */
  const matched  = (an.matchedKeywords || []).length;
  const missing  = (an.missingKeywords || []).length;
  const kwScore  = matched + missing === 0 ? 50 : Math.round((matched / (matched + missing)) * 100);

  return [
    {
      icon: "👤", title: "Contact Information", status: grade(contactScore), score: contactScore,
      tip: sf.contact || (
        contactScore >= 90
          ? "All key contact fields present — great first impression!"
          : `Missing: ${missingContact.join(", ")}. Add them to improve recruiter reach.`
      ),
      detail: "ATS systems check for Name, Email, Phone, Location, LinkedIn, and GitHub. Missing fields reduce trust and hurt your score. LinkedIn presence alone can improve callback rates by 40%.",
    },
    {
      icon: "📝", title: "Professional Summary", status: grade(summaryScore), score: summaryScore,
      tip: sf.summary || (
        !sd.summary
          ? "Add a 40–80 word summary tailored to this specific role — it's one of the first things ATS and recruiters read."
          : summaryWords < 30
          ? `Your summary is only ${summaryWords} words. Expand to 40–80 words with role-specific keywords like: "${(an.missingKeywords || []).slice(0, 3).join('", "')}".`
          : "Summary is present. Ensure it contains keywords from the job description and quantified achievements."
      ),
      detail: "A professional summary is parsed immediately by ATS. It should mention your job title, years of experience, 2–3 key technical skills from the JD, and one quantified achievement. Summaries of 40–80 words perform best.",
    },
    {
      icon: "💼", title: "Work Experience", status: grade(expScore), score: expScore,
      tip: sf.experience || (
        expCount === 0
          ? "No experience entries detected. Add your work history with role-specific bullet points."
          : expWithDesc < expCount
          ? `${expCount - expWithDesc} of ${expCount} roles have thin descriptions. Add 3–5 achievement-focused bullets per role with action verbs and numbers.`
          : "Experience section is solid. Verify each bullet starts with an action verb and includes a measurable result."
      ),
      detail: "Experience carries the most ATS weight. Each role needs 3–5 bullets starting with strong action verbs (Led, Built, Reduced, Increased). Quantified results (e.g., 'Improved API response time by 40%') score significantly higher than vague descriptions.",
    },
    {
      icon: "🎓", title: "Education", status: grade(eduScore), score: eduScore,
      tip: sf.education || (
        eduCount === 0
          ? "No education detected. Add your degree, institution name, and graduation year."
          : "Education section found. Ensure degree, institution, and graduation year are all present."
      ),
      detail: "Include your highest degree first. Add institution name, graduation year (or expected), and GPA if above 3.5. Relevant coursework or academic honours can further boost this section.",
    },
    {
      icon: "🛠️", title: "Skills", status: grade(skillScore), score: skillScore,
      tip: sf.skills || (
        skillCount === 0
          ? "No skills section detected. Add a dedicated skills section with 12–20 technical and soft skills."
          : skillCount < 8
          ? `Only ${skillCount} skills found. Aim for 12–20. Add these missing JD keywords: "${(an.missingKeywords || []).slice(0, 5).join('", "')}".`
          : `${skillCount} skills detected. Cross-check with missing keywords and add relevant ones.`
      ),
      detail: "ATS keyword-matches skills directly against the job description. Include exact terminology from the JD — if the JD says 'React.js', use 'React.js', not just 'React'. Aim for 12–20 skills covering both technical and domain expertise.",
    },
    {
      icon: "🔑", title: "Keyword Match", status: grade(kwScore), score: kwScore,
      tip: kwScore >= 70
        ? `${matched} of ${matched + missing} job keywords matched — strong alignment.`
        : `Only ${matched} of ${matched + missing} job keywords found. The ${Math.min(missing, 6)} missing keywords could add ${Math.round((Math.min(missing, 6) / (matched + missing)) * 30)} pts to your score.`,
      detail: "ATS compares your resume word-for-word against the job description. Higher keyword overlap = higher match score. View the Keywords tab to see exactly which terms are missing and where to add them.",
    },
  ];
}

/* ─────────────────────────────────────────────────────
   Derive improvement cards
───────────────────────────────────────────────────── */
function buildImprovements(structuredData: any, analysis: any, _sections: ReturnType<typeof buildSections>) {
  const improvements: { impact: "High" | "Medium" | "Low"; title: string; description: string }[] = [];
  const sd = structuredData || {};
  const an = analysis || {};

  /* ── 1. Inject AI-provided specific suggestions first ── */
  const aiSuggestions: string[] = an.suggestions || [];
  aiSuggestions.slice(0, 4).forEach((s, i) => {
    const impact: "High" | "Medium" | "Low" = i === 0 ? "High" : i <= 2 ? "Medium" : "Low";
    // Try to extract a short title from the suggestion text
    const title = s.split(/[:.–—]/)[0]?.trim().slice(0, 60) || `Improvement ${i + 1}`;
    const description = s.trim();
    if (title && description) improvements.push({ impact, title, description });
  });

  /* ── 2. Structural checks (add only if not already covered by AI) ── */
  const hasKeywordItem = improvements.some(i => /keyword/i.test(i.title + i.description));
  const missing = (an.missingKeywords || []).slice(0, 8);
  if (!hasKeywordItem && missing.length > 0) {
    improvements.push({
      impact: "High",
      title: `Add ${missing.length} Missing Keywords to Your Resume`,
      description: `These keywords appear in the job description but are absent from your resume: "${missing.join('", "')}". Add them naturally into your Skills section and Experience bullet points. Exact wording matters for ATS matching.`,
    });
  }

  if (!sd.summary) {
    improvements.push({ impact: "High", title: "Add a Professional Summary Section", description: "Your resume has no professional summary. This is one of the most ATS-critical sections. Write 40–80 words: start with your job title, years of experience, 2–3 key skills from the job description, and one quantified achievement." });
  } else if (sd.summary.split(/\s+/).length < 25) {
    improvements.push({ impact: "Medium", title: "Expand Your Professional Summary", description: `Your summary is only ${sd.summary.split(/\s+/).length} words — too brief for ATS. Aim for 40–80 words. Include: your current role, years of experience, top technical skills (matching the JD), and a measurable impact statement.` });
  }

  const expWithoutDesc = (sd.experience || []).filter((e: any) => !e.description || e.description.length < 60);
  if (expWithoutDesc.length > 0) {
    const roles = expWithoutDesc.map((e: any) => e.title || "Unknown role").join(", ");
    improvements.push({ impact: "High", title: "Add Achievement Bullets to Thin Experience Entries", description: `${expWithoutDesc.length} role(s) have weak or missing descriptions: "${roles}". For each, add 3–5 bullets starting with action verbs (Led, Built, Reduced, Delivered) with quantifiable results — e.g., "Increased system throughput by 35% through query optimization".` });
  }

  if ((sd.skills || []).length < 8) {
    improvements.push({ impact: "Medium", title: "Expand Your Skills Section", description: `Only ${(sd.skills || []).length} skill(s) detected — ATS expects 12–20. Pull skills directly from the job description (use exact wording). Add both technical skills (frameworks, tools, languages) and domain-relevant soft skills.` });
  }

  if (!sd.linkedin) {
    improvements.push({ impact: "Medium", title: "Add Your LinkedIn Profile URL", description: "87% of recruiters check LinkedIn before interviewing candidates. Adding your LinkedIn URL also provides ATS with additional signal about your experience and endorsements. Include it in the contact section header." });
  }

  if (!(sd.github || sd.portfolio)) {
    improvements.push({ impact: "Low", title: "Add GitHub or Portfolio URL", description: "For technical and creative roles, a GitHub or portfolio link gives recruiters direct evidence of your work. It significantly differentiates you from candidates who only describe skills without showing them." });
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return improvements.filter(({ title }) => {
    if (seen.has(title)) return false;
    seen.add(title);
    return true;
  });
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────
   Upload scan steps
───────────────────────────────────────────────────── */
const SCAN_STEPS = [
  { id:1, label:"Uploading Resume",     icon:"📤", desc:"Securely transmitting your document to our servers..." },
  { id:2, label:"Parsing PDF",          icon:"📄", desc:"Extracting text, structure, and formatting from your resume..." },
  { id:3, label:"Analyzing Keywords",   icon:"🔍", desc:"Matching critical keywords against ATS requirements..." },
  { id:4, label:"Calculating ATS Score",icon:"🎯", desc:"GPT-4o computing your personalized ATS score..." },
];

export default function AtsScorePage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [phase, setPhase] = useState<"uploading" | "scanning" | "finalizing" | "loading" | "results" | "enhancing" | "enhanced">("loading");
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [resumeView, setResumeView]       = useState<"original" | "enhanced">("original");

  /* Upload progress state */
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProg, setUploadProg] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const apiResultRef = useRef<any>(null);
  const phaseRef = useRef(phase);
  const initDoneRef = useRef(false);
  phaseRef.current = phase;

  /* Job description modal state */
  const [showJdModal, setShowJdModal] = useState(false);
  const [jobDescInput, setJobDescInput] = useState("");

  /* Resume template collapsible */
  const [showResumeTemplate, setShowResumeTemplate] = useState(false);

  const showResults = useCallback((data: any) => {
    window.localStorage.setItem("atsAnalyzeResult", JSON.stringify(data));
    setResult(data);
    setPhase("results");
  }, []);

  /* Upload progress animation */
  useEffect(() => {
    if (phase !== "uploading") return;
    let cur = 0;
    const iv = setInterval(() => {
      cur += Math.max(0.6, (100 - cur) * 0.034);
      if (cur >= 99.5) {
        cur = 100; setUploadProg(100); clearInterval(iv);
        setTimeout(() => { setPhase("scanning"); setScanStep(1); setScanProgress(0); }, 650);
      } else setUploadProg(cur);
    }, 40);
    return () => clearInterval(iv);
  }, [phase]);

  /* Scanning timeline */
  useEffect(() => {
    if (phase !== "scanning") return;
    const schedule = [
      {delay:300,step:1,prog:10},{delay:950,step:1,prog:22},{delay:1800,step:2,prog:36},
      {delay:2700,step:2,prog:50},{delay:3600,step:3,prog:63},{delay:4500,step:3,prog:75},
      {delay:5400,step:4,prog:85},{delay:6300,step:4,prog:93},
    ];
    const timers = schedule.map(({ delay, step, prog }) =>
      setTimeout(() => { setScanStep(step); setScanProgress(prog); }, delay));
    const done = setTimeout(() => {
      setScanProgress(95);
      if (apiResultRef.current) { setScanProgress(100); setTimeout(() => showResults(apiResultRef.current), 400); }
      else setPhase("finalizing");
    }, 7500);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [phase, showResults]);

  /* Finalizing pulse */
  useEffect(() => {
    if (phase !== "finalizing") return;
    const iv = setInterval(() => setScanProgress(p => p >= 98 ? 95 : p + 0.4), 200);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    /* Guard against React Strict Mode double-invocation */
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    /* Check for a pending upload started on the home page */
    const pendingFile    = uploadStore.getPendingFile();
    const pendingPromise = uploadStore.getPendingPromise();
    if (pendingFile && pendingPromise) {
      uploadStore.clearAll();
      setUploadFile(pendingFile);
      apiResultRef.current = null;
      setScanStep(1); setScanProgress(0);
      setPhase("scanning");
      pendingPromise
        .then(data => {
          if (data.success) {
            apiResultRef.current = data;
            if (phaseRef.current === "finalizing") {
              setScanProgress(100);
              setTimeout(() => showResults(data), 400);
            }
          } else {
            setPhase("loading");
          }
        })
        .catch(() => { setPhase("loading"); });
      return;
    }

    /* Fallback: check localStorage for existing result */
    const stored = window.localStorage.getItem("atsAnalyzeResult");
    if (!stored) { router.replace("/"); return; }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.success) throw new Error("invalid");
      setResult(parsed);
      setPhase("results");
    } catch { router.replace("/"); }
  }, [router, showResults]);

  /* Open the job-description modal before enhancing */
  const requestEnhance = () => {
    setJobDescInput("");
    setShowJdModal(true);
  };

  const handleEnhance = async (jobDescription: string) => {
    if (!result) return;
    setShowJdModal(false);
    setPhase("enhancing");
    setEnhanceError(null);
    setEnhanceProgress(0);

    const tick = setInterval(() => setEnhanceProgress((p) => (p >= 85 ? p : p + Math.random() * 3.5)), 450);

    try {
      const res = await fetch("/api/enhance-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: result.structuredData,
          jobDescription: jobDescription || result.jobDescription || "",
          resumeId: result.resumeId,
        }),
      });
      const json = await res.json();
      clearInterval(tick);
      if (!res.ok || !json.success) {
        setEnhanceError(json.error || "Enhancement failed.");
        setPhase("results");
        return;
      }
      setEnhanceProgress(100);
      setTimeout(() => {
        setEnhancedData(json.enhanced);
        setResumeView("enhanced");
        setShowResumeTemplate(true);
        setPhase("results");
      }, 400);
    } catch {
      clearInterval(tick);
      setEnhanceError("Enhancement failed. Please try again.");
      setPhase("results");
    }
  };

  const handleSaveResume = async (editedData: any) => {
    await fetch("/api/update-resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: enhancedData?.resumeId || result?.resumeId, structuredData: editedData }),
    }).catch(console.error);
  };

  /* ── UPLOADING ── */
  if (phase === "uploading" && uploadFile) {
    const done = uploadProg >= 100;
    const sz = 200, r = 80, circ = 2 * Math.PI * r;
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col" style={{ background:"radial-gradient(ellipse 80% 60% at 50% -10%,rgba(16,185,129,.08),transparent)" }}>
        {/* Top bar */}
        <div className="border-b border-slate-800/50 px-8 h-14 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background:"linear-gradient(135deg,#34d399,#0d9488)" }}>A</div>
            <span className="font-bold text-white text-base tracking-tight">ATS<span style={{ background:"linear-gradient(135deg,#10b981,#14b8a6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Checker</span></span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: big progress ring */}
            <div className="flex flex-col items-center gap-8">
              <div className="relative" style={{ width:sz, height:sz }}>
                <div className="absolute inset-0 rounded-full" style={{ boxShadow:`0 0 ${done?80:45}px rgba(16,185,129,${done?.4:.15})`, transition:"box-shadow .7s ease" }}/>
                <div className="absolute inset-[-10px] rounded-full opacity-20" style={{ border:"1px dashed rgba(16,185,129,.5)", animation:"spin 10s linear infinite" }}/>
                <div className="absolute inset-[-20px] rounded-full opacity-10" style={{ border:"1px dashed rgba(16,185,129,.3)", animation:"spin 16s linear infinite reverse" }}/>
                <svg width={sz} height={sz} className="-rotate-90" viewBox={`0 0 ${sz} ${sz}`}>
                  <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#0f172a" strokeWidth="12"/>
                  <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#10b981" strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={circ-(uploadProg/100)*circ} strokeLinecap="round"
                    style={{ filter:"drop-shadow(0 0 14px rgba(16,185,129,.7))", transition:"stroke-dashoffset .08s linear" }}/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {done
                    ? <span className="text-6xl" style={{ animation:"checkPop .5s cubic-bezier(.34,1.56,.64,1) both" }}>✅</span>
                    : <><span className="text-5xl font-black text-emerald-400 tabular-nums">{Math.round(uploadProg)}%</span><span className="text-sm text-slate-500 mt-1 font-medium">uploading</span></>
                  }
                </div>
              </div>

              {/* File info */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 mb-2">
                  <span className="text-lg">📄</span>
                  <span className="text-sm font-semibold text-slate-200 max-w-[220px] truncate">{uploadFile.name}</span>
                </div>
                <p className="text-xs text-slate-600">{(uploadFile.size/1024/1024).toFixed(2)} MB · PDF</p>
              </div>
            </div>

            {/* Right: status + bar */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-white mb-3">Uploading Your Resume</h2>
                <p className="text-slate-400 leading-relaxed">
                  Securely transmitting your resume to our servers. Your file is encrypted end-to-end — we never store raw PDFs beyond analysis.
                </p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className={uploadProg>=100?"text-emerald-400 font-semibold":"text-slate-400"}>
                    {uploadProg>=100 ? "✓ Upload complete — starting AI analysis…" : "Uploading resume…"}
                  </span>
                  <span className="text-emerald-400 font-bold tabular-nums">{Math.round(uploadProg)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-75" style={{ width:`${uploadProg}%`, background:"linear-gradient(90deg,#10b981,#14b8a6,#34d399)", boxShadow:"0 0 12px rgba(16,185,129,.5)" }}/>
                </div>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon:"🔒", title:"End-to-end encrypted", desc:"Your resume travels over TLS — never intercepted" },
                  { icon:"🤖", title:"GPT-4o analysis ready", desc:"AI engine pre-loaded and waiting for your file" },
                  { icon:"⚡", title:"Results in ~30 seconds", desc:"Score, keyword gaps, and section breakdown" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
                    <span className="text-lg shrink-0">{icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes checkPop{0%{transform:scale(0) rotate(-25deg);opacity:0}65%{transform:scale(1.2) rotate(6deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}`}</style>
      </div>
    );
  }

  /* ── SCANNING / FINALIZING ── */
  if (phase === "scanning" || phase === "finalizing") {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col" style={{ background:"radial-gradient(ellipse 80% 50% at 50% -5%,rgba(16,185,129,.07),transparent)" }}>
        {/* Top bar */}
        <div className="border-b border-slate-800/50 px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background:"linear-gradient(135deg,#34d399,#0d9488)" }}>A</div>
            <span className="font-bold text-white text-base tracking-tight">ATS<span style={{ background:"linear-gradient(135deg,#10b981,#14b8a6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Checker</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            AI is working…
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: document scanner visual */}
            <div className="flex flex-col items-center gap-6">
              {/* Big document mock */}
              <div className="relative w-64 h-80 rounded-2xl border border-slate-700/70 shadow-2xl shadow-black/60 overflow-hidden" style={{ background:"#0d1829" }}>
                {/* Document lines */}
                <div className="p-6 space-y-3">
                  <div className="h-3 w-2/5 rounded bg-slate-700"/>
                  <div className="h-1.5 rounded bg-slate-800"/>
                  <div className="h-1.5 w-11/12 rounded bg-slate-800"/>
                  <div className="h-1.5 w-4/5 rounded bg-slate-800"/>
                  <div className="mt-4 h-2 w-1/4 rounded bg-slate-700"/>
                  <div className="h-1.5 w-full rounded bg-slate-800"/>
                  <div className="h-1.5 w-10/12 rounded bg-slate-800"/>
                  <div className="h-1.5 w-full rounded bg-slate-800"/>
                  <div className="h-1.5 w-9/12 rounded bg-slate-800"/>
                  <div className="mt-4 h-2 w-1/3 rounded bg-slate-700"/>
                  <div className="h-1.5 w-full rounded bg-slate-800"/>
                  <div className="h-1.5 w-11/12 rounded bg-slate-800"/>
                  <div className="h-1.5 w-4/5 rounded bg-slate-800"/>
                  <div className="h-1.5 w-full rounded bg-slate-800"/>
                  <div className="h-1.5 w-3/4 rounded bg-slate-800"/>
                </div>
                {/* Scan beam */}
                <div className="absolute left-0 right-0 h-0.5 pointer-events-none" style={{ top:`${Math.min(scanProgress,97)}%`, background:"linear-gradient(90deg,transparent,rgba(52,211,153,1),transparent)", boxShadow:"0 0 16px 4px rgba(52,211,153,.35)", transition:"top .8s ease-in-out" }}/>
                {/* Highlight overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ background:`linear-gradient(to bottom, transparent ${Math.min(scanProgress,97)-4}%, rgba(52,211,153,.03) ${Math.min(scanProgress,97)}%, transparent ${Math.min(scanProgress,97)+2}%)`, transition:"all .8s ease-in-out" }}/>
              </div>

              {/* Overall progress */}
              <div className="w-64">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">{phase === "finalizing" ? "Finalizing results…" : "Scanning document…"}</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width:`${scanProgress}%`, background:"linear-gradient(90deg,#10b981,#14b8a6)", boxShadow:"0 0 8px rgba(16,185,129,.4)" }}/>
                </div>
              </div>
            </div>

            {/* Right: steps + headline */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  GPT-4o · Live Analysis
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-3">
                  {phase === "finalizing" ? "Almost There…" : "AI is Analyzing Your Resume"}
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  {phase === "finalizing"
                    ? "Generating your personalized ATS score, keyword gaps, and improvement suggestions."
                    : "GPT-4o is reading every section of your resume and evaluating it against ATS rubrics."}
                </p>
              </div>

              {/* Step list */}
              <div className="space-y-3">
                {SCAN_STEPS.map(step => {
                  const active = scanStep === step.id && phase !== "finalizing";
                  const done   = scanStep > step.id || phase === "finalizing";
                  return (
                    <div key={step.id} className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 ${
                      active ? "border-emerald-500/40 bg-emerald-500/6 shadow-lg shadow-emerald-500/5"
                      : done  ? "border-slate-800/60 bg-slate-900/20"
                              : "border-transparent opacity-30"
                    }`}>
                      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 ${
                        done   ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : active ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                 : "bg-slate-800 text-slate-600"
                      }`}>
                        {done ? "✓" : step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${done?"text-emerald-400":active?"text-slate-100":"text-slate-600"}`}>{step.label}</p>
                        {active && <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>}
                        {done && <p className="text-xs text-emerald-500/70 mt-0.5">Complete</p>}
                      </div>
                      {active && <div className="shrink-0 w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"/>}
                    </div>
                  );
                })}

                {/* Finalizing step */}
                {phase === "finalizing" && (
                  <div className="flex items-center gap-4 rounded-2xl border border-violet-500/35 bg-violet-500/6 px-5 py-4 shadow-lg shadow-violet-500/5">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center text-base">✨</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-violet-200">Finalizing Results</p>
                      <p className="text-xs text-slate-400 mt-0.5">Generating your personalized ATS insights…</p>
                    </div>
                    <div className="shrink-0 w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"/>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── LOADING ── */
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── ENHANCING ── */
  if (phase === "enhancing") {
    const enhSteps = [
      { label:"Analyzing job requirements",          threshold:15 },
      { label:"Rewriting professional summary",      threshold:32 },
      { label:"Optimizing experience bullet points", threshold:52 },
      { label:"Injecting missing keywords",          threshold:70 },
      { label:"Finalizing enhanced resume",          threshold:100 },
    ];
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col" style={{ background:"radial-gradient(ellipse 70% 50% at 50% -5%,rgba(16,185,129,.07),transparent)" }}>
        {/* Top bar */}
        <div className="border-b border-slate-800/50 px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background:"linear-gradient(135deg,#34d399,#0d9488)" }}>A</div>
            <span className="font-bold text-white text-base tracking-tight">ATS<span style={{ background:"linear-gradient(135deg,#10b981,#14b8a6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Checker</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            AI Enhancing…
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: visual */}
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full opacity-20" style={{ border:"2px dashed rgba(16,185,129,.4)", animation:"spin 8s linear infinite" }}/>
                <div className="absolute inset-4 rounded-full opacity-15" style={{ border:"2px dashed rgba(16,185,129,.3)", animation:"spin 12s linear infinite reverse" }}/>
                <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center" style={{ animation:"pulse 2s ease-in-out infinite" }}>
                  <span className="text-5xl">✨</span>
                </div>
              </div>

              {/* Big progress number */}
              <div className="text-center">
                <p className="text-6xl font-black text-emerald-400 tabular-nums">{Math.round(enhanceProgress)}%</p>
                <p className="text-sm text-slate-500 mt-1">complete</p>
              </div>

              <div className="w-56">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width:`${enhanceProgress}%`, background:"linear-gradient(90deg,#10b981,#14b8a6,#34d399)", boxShadow:"0 0 10px rgba(16,185,129,.5)" }}/>
                </div>
              </div>
            </div>

            {/* Right: steps */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  GPT-4o · Resume Rewrite
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-3">Enhancing Your Resume</h2>
                <p className="text-slate-400 leading-relaxed">
                  AI is rewriting your resume to align with the job description, inject missing keywords, and maximize every ATS signal. Takes 15–30 seconds.
                </p>
              </div>

              <div className="space-y-3">
                {enhSteps.map(({ label, threshold }) => {
                  const done = enhanceProgress >= threshold;
                  const active = !done && enhanceProgress >= threshold - 20;
                  return (
                    <div key={label} className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-500 ${
                      done   ? "border-slate-800/60 bg-slate-900/20"
                      : active ? "border-emerald-500/40 bg-emerald-500/6"
                               : "border-transparent opacity-30"
                    }`}>
                      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        done   ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                        : active ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                                 : "bg-slate-800 text-slate-600"
                      }`}>
                        {done ? "✓" : "⏳"}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${done?"text-emerald-400":active?"text-slate-200":"text-slate-600"}`}>{label}</p>
                        {done && <p className="text-xs text-emerald-500/70 mt-0.5">Complete</p>}
                        {active && !done && <p className="text-xs text-slate-400 mt-0.5">In progress…</p>}
                      </div>
                      {active && !done && <div className="shrink-0 w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"/>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)}}`}</style>
      </div>
    );
  }

  const analysis = result?.analysis || {};
  const sd = result?.structuredData || {};
  const score = analysis.atsScore ?? 0;

  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
  const scoreBg    = score >= 70 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                   : score >= 40 ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                   :               "bg-red-500/10 border-red-500/30 text-red-400";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 70 ? "Good Match" : score >= 50 ? "Fair — Needs Work" : score >= 30 ? "Poor — Major Issues" : "Critical — Rewrite Needed";
  const scoreAdvice = score >= 70
    ? "Your resume is a strong match. A few targeted enhancements with AI could push it to 90+."
    : score >= 40
    ? "Your resume partially matches. Keyword gaps and missing sections are holding you back."
    : "Your resume needs significant improvement to pass this ATS. Let AI fix it for you.";

  const sections = buildSections(sd, analysis);
  const improvements = buildImprovements(sd, analysis, sections);


  /* ── RESULTS PAGE ── */

  /* Derive per-section found/issues/fix data inline for the expanded cards */
  const contactFields = ["name","email","phone","address","linkedin","github","portfolio"];
  const contactPresent = contactFields.filter(f => sd[f] && (sd[f] as string).trim().length > 0);
  const contactMissing = contactFields.filter(f => !sd[f] || !(sd[f] as string).trim().length);

  const summaryWords = sd.summary ? (sd.summary as string).split(/\s+/).length : 0;
  const summaryPreview = sd.summary ? (sd.summary as string).split(/\s+/).slice(0, 30).join(" ") + (summaryWords > 30 ? "…" : "") : "";

  const expEntries: any[] = sd.experience || [];
  const expThin = expEntries.filter(e => !e.description || (e.description as string).length < 80);

  const skillsList: string[] = sd.skills || [];
  const matchedKws: string[] = analysis.matchedKeywords || [];
  const missingKws: string[] = analysis.missingKeywords || [];
  const totalKws = matchedKws.length + missingKws.length;
  const kwPct = totalKws === 0 ? 50 : Math.round((matchedKws.length / totalKws) * 100);

  const statusCfg: Record<GradeStatus, { label: string; textColor: string; barColor: string; badge: string; border: string }> = {
    good:    { label: "Good",       textColor: "text-emerald-400", barColor: "bg-emerald-500", badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400", border: "border-emerald-500/25" },
    fair:    { label: "Fair",       textColor: "text-amber-400",   barColor: "bg-amber-500",   badge: "bg-amber-500/15 border-amber-500/30 text-amber-400",       border: "border-amber-500/25" },
    poor:    { label: "Needs Work", textColor: "text-red-400",     barColor: "bg-red-500",     badge: "bg-red-500/15 border-red-500/30 text-red-400",             border: "border-red-500/25" },
    missing: { label: "Missing",    textColor: "text-slate-400",   barColor: "bg-slate-600",   badge: "bg-slate-700/50 border-slate-600 text-slate-400",          border: "border-slate-700" },
  };

  /* Per-section found/issues/fix triples */
  const sectionDetails: {
    found: React.ReactNode;
    issues: string[];
    fix: string[];
  }[] = [
    /* 0 — Contact */
    {
      found: (
        <div className="space-y-1">
          {contactFields.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs">
              <span className={contactPresent.includes(f) ? "text-emerald-400" : "text-slate-600"}>
                {contactPresent.includes(f) ? "✓" : "✗"}
              </span>
              <span className={`capitalize ${contactPresent.includes(f) ? "text-slate-300" : "text-slate-600"}`}>{f}</span>
              {contactPresent.includes(f) && sd[f] && (
                <span className="text-slate-500 truncate max-w-[120px]">{String(sd[f]).slice(0,30)}</span>
              )}
            </div>
          ))}
        </div>
      ),
      issues: contactMissing.length === 0
        ? ["All contact fields detected — no issues found."]
        : contactMissing.map(f => `Missing ${f.charAt(0).toUpperCase() + f.slice(1)} — recruiters and ATS cannot reach you without it`),
      fix: [
        "Place contact info in a clean single-line or two-line header at the very top of your resume.",
        "Use a professional email (firstname.lastname@gmail.com) — avoid nicknames or old university emails.",
        contactMissing.includes("linkedin") ? "Create or update your LinkedIn profile and add the URL (linkedin.com/in/yourname)." : "Ensure your LinkedIn URL is shortened and current.",
        contactMissing.includes("github") || contactMissing.includes("portfolio") ? "Add a GitHub or portfolio URL if applying for technical or creative roles." : "Keep your GitHub/portfolio up to date with your best work.",
      ],
    },

    /* 1 — Summary */
    {
      found: sd.summary ? (
        <div className="space-y-2">
          <div className="text-xs text-slate-400">{summaryWords} words detected</div>
          <p className="text-xs text-slate-300 leading-relaxed italic">"{summaryPreview}"</p>
          <div className={`text-xs font-semibold ${summaryWords >= 40 ? "text-emerald-400" : summaryWords >= 20 ? "text-amber-400" : "text-red-400"}`}>
            {summaryWords >= 40 ? "Good length" : summaryWords >= 20 ? "Too short — aim for 40–80 words" : "Very brief — expand significantly"}
          </div>
        </div>
      ) : (
        <p className="text-xs text-red-400 font-semibold">No professional summary detected in your resume.</p>
      ),
      issues: !sd.summary
        ? ["No professional summary found — this is one of the first sections ATS and recruiters read.", "Without a summary, ATS cannot quickly match your profile to the role."]
        : [
            ...(summaryWords < 40 ? [`Summary is only ${summaryWords} words — too brief to include enough keywords.`] : []),
            ...(missingKws.length > 0 ? [`Missing keywords not present in summary: ${missingKws.slice(0,3).join(", ")}`] : []),
            "Ensure summary mentions your job title, years of experience, and a quantified achievement.",
          ],
      fix: [
        "Write a 40–80 word summary starting with: '[Job Title] with [X] years of experience in [domain].'",
        `Include 2–3 hard skills from the job description — for example: "${missingKws.slice(0,3).join('", "') || "relevant technologies"}"`,
        "Add one quantified achievement: e.g., 'Delivered a 35% reduction in load time by refactoring the API layer.'",
        "Tailor the summary to each role — copy the exact job title from the job posting.",
      ],
    },

    /* 2 — Experience */
    {
      found: expEntries.length === 0 ? (
        <p className="text-xs text-red-400 font-semibold">No work experience entries detected.</p>
      ) : (
        <div className="space-y-2">
          {expEntries.slice(0,5).map((e: any, i: number) => (
            <div key={i} className="text-xs">
              <span className="text-slate-200 font-semibold">{e.title || "Unknown Role"}</span>
              {e.company && <span className="text-slate-500"> · {e.company}</span>}
              {e.duration && <span className="text-slate-600"> ({e.duration})</span>}
              <span className={`ml-2 text-xs ${(!e.description || e.description.length < 80) ? "text-red-400" : "text-emerald-400"}`}>
                {(!e.description || e.description.length < 80) ? "thin" : "detailed"}
              </span>
            </div>
          ))}
          {expEntries.length > 5 && <p className="text-xs text-slate-600">+{expEntries.length - 5} more roles</p>}
        </div>
      ),
      issues: expEntries.length === 0
        ? ["No experience section found — this is critical for ATS scoring.", "Without experience, ATS cannot assess your role fit."]
        : [
            ...(expThin.length > 0 ? [`${expThin.length} role(s) have thin or missing descriptions — less than 80 characters.`] : []),
            "Check that each role has 3–5 bullet points starting with strong action verbs.",
            "Bullets without quantified results score lower in ATS semantic analysis.",
          ],
      fix: [
        "For each role, add 3–5 bullets. Start each with a strong action verb: Led, Built, Reduced, Delivered, Increased.",
        "Quantify every result: 'Improved API response time by 40%' beats 'Improved API performance'.",
        "Use exact terminology from the job description in your bullet points to maximize keyword matching.",
        "List experience in reverse-chronological order. Include company name, role title, and date range for every entry.",
      ],
    },

    /* 3 — Education */
    {
      found: (sd.education || []).length === 0 ? (
        <p className="text-xs text-red-400 font-semibold">No education entries detected.</p>
      ) : (
        <div className="space-y-2">
          {(sd.education as any[]).map((e: any, i: number) => (
            <div key={i} className="text-xs">
              <span className="text-slate-200 font-semibold">{e.degree || "Degree"}</span>
              {e.institution && <span className="text-slate-500"> · {e.institution}</span>}
              {e.year && <span className="text-slate-600"> ({e.year})</span>}
            </div>
          ))}
        </div>
      ),
      issues: (sd.education || []).length === 0
        ? ["No education section detected — add at least your highest qualification.", "Missing degree, institution, or year will lower your ATS education score."]
        : [
            "Verify that degree title, institution name, and graduation year are all present.",
            "Add GPA if it is 3.5 or above — some ATS systems filter on this.",
          ],
      fix: [
        "Add each qualification with: Degree Name, Institution, Graduation Year (or 'Expected [Year]').",
        "Place your highest qualification first (reverse-chronological order).",
        "Include GPA if 3.5+ and the job posting is entry-level or asks for it.",
        "List relevant coursework or honours if you are a recent graduate with limited experience.",
      ],
    },

    /* 4 — Skills */
    {
      found: skillsList.length === 0 ? (
        <p className="text-xs text-red-400 font-semibold">No skills detected in your resume.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">{skillsList.length} skills found:</p>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.slice(0, 15).map((sk: string, i: number) => (
              <span key={i} className="bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs px-2.5 py-0.5 rounded-full">{sk}</span>
            ))}
            {skillsList.length > 15 && <span className="text-xs text-slate-600">+{skillsList.length - 15} more</span>}
          </div>
        </div>
      ),
      issues: [
        ...(skillsList.length === 0 ? ["No skills section found — ATS cannot perform keyword matching without it."] : []),
        ...(skillsList.length < 8 && skillsList.length > 0 ? [`Only ${skillsList.length} skills listed — aim for 12–20.`] : []),
        ...(missingKws.length > 0 ? [`${Math.min(missingKws.length, 5)} job-required keywords are absent from your skills: ${missingKws.slice(0,5).join(", ")}`] : []),
      ],
      fix: [
        "Create a dedicated 'Skills' or 'Technical Skills' section — do not bury skills in job descriptions.",
        `Add these missing JD keywords if you have experience with them: "${missingKws.slice(0,6).join('", "') || "see keyword section below"}"`,
        "Use exact wording from the job description — if it says 'React.js' use 'React.js', not just 'React'.",
        "Aim for 12–20 skills covering: programming languages, frameworks, tools, platforms, and domain skills.",
      ],
    },

    /* 5 — Keyword Match */
    {
      found: (
        <div className="space-y-2">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-emerald-400 font-bold text-base">{matchedKws.length}</span>
              <span className="text-slate-500 ml-1">matched</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold text-base">{missingKws.length}</span>
              <span className="text-slate-500 ml-1">missing</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kwPct}%` }} />
          </div>
          <p className="text-xs text-slate-400">{kwPct}% keyword alignment with the job description</p>
        </div>
      ),
      issues: [
        ...(missingKws.length > 0 ? [`${missingKws.length} keywords from the job description are not in your resume.`] : []),
        ...(kwPct < 50 ? ["Keyword match below 50% — your resume may be auto-rejected by ATS before a human sees it."] : []),
        "ATS compares your resume word-for-word against the job description — synonyms often do not match.",
      ],
      fix: [
        "Add missing keywords naturally into your Skills section and Experience bullet points.",
        "Use the exact spelling from the job description — 'Machine Learning' and 'ML' are different tokens.",
        "Do not stuff keywords at the bottom in white text — modern ATS detects this and penalises it.",
        "Re-read the job description and highlight every technology, certification, and methodology — add the ones you have.",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#030712] text-slate-100 px-4 pb-20">
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .modal-in{animation:modalIn .25s cubic-bezier(.34,1.56,.64,1) both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .fade-in-0{animation:fadeInUp .5s ease both;animation-delay:0ms}
        .fade-in-1{animation:fadeInUp .5s ease both;animation-delay:80ms}
        .fade-in-2{animation:fadeInUp .5s ease both;animation-delay:160ms}
        .fade-in-3{animation:fadeInUp .5s ease both;animation-delay:240ms}
        .fade-in-4{animation:fadeInUp .5s ease both;animation-delay:320ms}
        .fade-in-5{animation:fadeInUp .5s ease both;animation-delay:400ms}
        .fade-in-6{animation:fadeInUp .5s ease both;animation-delay:480ms}
        .fade-in-7{animation:fadeInUp .5s ease both;animation-delay:560ms}
        .fade-in-8{animation:fadeInUp .5s ease both;animation-delay:640ms}
        .fade-in-9{animation:fadeInUp .5s ease both;animation-delay:720ms}
        .fade-in-10{animation:fadeInUp .5s ease both;animation-delay:800ms}
        .fade-in-11{animation:fadeInUp .5s ease both;animation-delay:880ms}
      `}</style>

      <div className="max-w-5xl mx-auto space-y-8 pt-6">

        {/* ── TOP NAV ── */}
        <div className="fade-in-0 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1">
            ← Home
          </button>
          <button
            onClick={() => { window.localStorage.removeItem("atsAnalyzeResult"); router.push("/upload"); }}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 rounded-lg px-4 py-2 hover:border-slate-600"
          >
            Upload New Resume
          </button>
        </div>

        {/* ── HERO SCORE CARD ── */}
        <div className="fade-in-1 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-8">

            {/* Animated ring */}
            <div className="relative flex-shrink-0">
              <ScoreRing score={score} size={160} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className={`text-5xl font-black ${scoreColor}`}>
                  <AnimatedScore target={score} />
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
                <span className={`text-[10px] font-bold mt-0.5 ${scoreColor}`}>{scoreLabel}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center md:text-left">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold mb-3 ${scoreBg}`}>
                {scoreLabel}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-lg">
                {analysis.overallSummary || scoreAdvice}
              </p>

              {/* 4 stat pills */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2 text-center min-w-[90px]">
                  <p className="text-2xl font-black text-emerald-400">{matchedKws.length}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Keywords Matched</p>
                </div>
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-2 text-center min-w-[90px]">
                  <p className="text-2xl font-black text-amber-400">{missingKws.length}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Keywords Missing</p>
                </div>
                <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-2 text-center min-w-[90px]">
                  <p className="text-2xl font-black text-blue-400">{skillsList.length}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Skills Detected</p>
                </div>
                <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 px-4 py-2 text-center min-w-[90px]">
                  <p className="text-2xl font-black text-purple-400">{expEntries.length}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Roles Found</p>
                </div>
              </div>
            </div>

            {/* Mini section bars (desktop) */}
            <div className="hidden lg:flex flex-col gap-2.5 w-44 flex-shrink-0">
              {sections.map(s => (
                <div key={s.title}>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span className="truncate max-w-[110px]">{s.title.split(" ")[0]}</span>
                    <span className={statusCfg[s.status as GradeStatus].textColor}>{s.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-1000 ${statusCfg[s.status as GradeStatus].barColor}`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION HEADING ── */}
        <div className="fade-in-2 text-center">
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Resume Analysis — Section by Section</h2>
          <p className="text-sm text-slate-400">Every section is fully expanded below with specific findings, issues, and actionable fixes.</p>
        </div>

        {/* ── 6 SECTION CARDS ── */}
        {sections.map((sec, idx) => {
          const cfg = statusCfg[sec.status as GradeStatus];
          const det = sectionDetails[idx];
          return (
            <div
              key={sec.title}
              className={`fade-in-${3 + idx} rounded-2xl border ${cfg.border} bg-slate-900/60 overflow-hidden shadow-lg`}
            >
              {/* Card header */}
              <div className="p-5 border-b border-slate-800/60">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{sec.icon}</span>
                  <h3 className="text-base font-bold text-slate-100 flex-1">{sec.title}</h3>
                  <span className={`text-sm font-bold ${cfg.textColor}`}>{sec.score}%</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${cfg.barColor}`} style={{ width: `${sec.score}%` }} />
                </div>
              </div>

              {/* Card body — 3 columns on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800/60">

                {/* Column 1: What We Found */}
                <div className="p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">What We Found</p>
                  {det.found}
                </div>

                {/* Column 2: Issues */}
                <div className="p-5">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Issues Identified</p>
                  <ul className="space-y-2">
                    {det.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="text-red-400 flex-shrink-0 mt-0.5 font-bold">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: How to Fix It */}
                <div className="p-5">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">How to Fix It</p>
                  <ol className="space-y-2">
                    {det.fix.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="text-emerald-400 flex-shrink-0 font-bold mt-0.5">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── STRENGTHS + SUGGESTIONS ── */}
        {((analysis.strengths || []).length > 0 || (analysis.suggestions || []).length > 0) && (
          <div className="fade-in-9 grid grid-cols-1 md:grid-cols-2 gap-6">
            {(analysis.strengths || []).length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6">
                <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2">
                  <span>✓</span> Strengths
                </h3>
                <ul className="space-y-2.5">
                  {(analysis.strengths as string[]).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5 font-bold">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(analysis.suggestions || []).length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-6">
                <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
                  <span>⚠</span> AI Suggestions
                </h3>
                <ul className="space-y-2.5">
                  {(analysis.suggestions as string[]).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 leading-relaxed">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5 font-bold">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── KEYWORD MATCH CARD ── */}
        <div className="fade-in-10 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>🔑</span> Keyword Match Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">How well your resume vocabulary aligns with the job description</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold flex-shrink-0 ${
              kwPct >= 70 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : kwPct >= 45 ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
            }`}>
              {kwPct}% Match
            </div>
          </div>

          {/* Two columns: matched | missing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                Matched Keywords ({matchedKws.length})
              </p>
              {matchedKws.length === 0 ? (
                <p className="text-xs text-slate-600">No matched keywords detected. Add a job description to enable keyword matching.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {matchedKws.map((kw, i) => (
                    <span key={i} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                Missing Keywords ({missingKws.length})
              </p>
              {missingKws.length === 0 ? (
                <p className="text-xs text-emerald-400 font-semibold">All detected keywords are present!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {missingKws.map((kw, i) => (
                    <span key={i} className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">
                      + {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Strategy tip */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-300 mb-1">Keyword Strategy</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add the missing keywords naturally into your Skills section and Experience bullets. Use the exact spelling from the job description — ATS systems are often case-insensitive but spelling-sensitive. Avoid keyword stuffing; instead, work terms into meaningful sentences that describe your real experience.
            </p>
          </div>
        </div>

        {/* ── KEY IMPROVEMENTS CARD ── */}
        <div className="fade-in-11 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg">
          <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
            <span>⚡</span> Key Improvements
          </h3>
          <p className="text-xs text-slate-400 mb-5">Prioritised list of changes that will have the biggest impact on your ATS score. Address High impact items first.</p>

          {improvements.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <p className="text-3xl mb-3">🎉</p>
              <p className="text-emerald-400 font-bold text-lg">No major issues found!</p>
              <p className="text-slate-400 text-sm mt-2">Your resume is well-structured. Use AI enhancement to fine-tune it for this specific role.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {improvements.map((imp, i) => (
                <ImprovementCard key={i} {...imp} />
              ))}
            </div>
          )}
        </div>

        {/* ── ACTION CARDS ── */}
        <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-900/80 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-50">What would you like to do next?</h2>
            <p className="text-slate-400 text-sm mt-1">Let AI apply all improvements automatically, or upload a different resume.</p>
          </div>

          {enhanceError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-5 text-center">⚠ {enhanceError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enhance with AI */}
            <button
              onClick={requestEnhance}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-7 text-center hover:border-emerald-400 hover:bg-emerald-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✨</div>
              <div>
                <p className="text-base font-bold text-emerald-400">Enhance Resume with AI</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  AI rewrites your resume using your extracted data, injects all missing keywords, and delivers a fully editable professional template.
                </p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 group-hover:bg-emerald-400 transition-colors">
                Enhance Now →
              </span>
            </button>

            {/* Upload new */}
            <button
              onClick={() => { window.localStorage.removeItem("atsAnalyzeResult"); router.push("/upload"); }}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-700 bg-slate-900/40 p-7 text-center hover:border-slate-600 hover:bg-slate-800/40 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
              <div>
                <p className="text-base font-bold text-slate-200">Upload New Resume</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Try a different resume or a new job description to get a fresh ATS score.
                </p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-600 text-slate-300 text-xs font-semibold px-4 py-1.5 group-hover:border-slate-500 transition-colors">
                Upload →
              </span>
            </button>
          </div>
        </div>

        {/* ── RESUME TEMPLATE (full-screen trigger) ── */}
        <button
          onClick={() => setShowResumeTemplate(o => !o)}
          className="w-full flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/60 px-6 py-4 text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 hover:border-slate-600 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">📄</span>
            <div className="text-left">
              <p className="font-semibold text-slate-200">View / Edit Resume</p>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Full-page editor · download as PDF</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 border border-slate-700 rounded-lg px-3 py-1.5">Open →</span>
        </button>

        {/* ── FULL-SCREEN RESUME OVERLAY ── */}
        {showResumeTemplate && (
          <div className="fixed inset-0 z-50 bg-[#060d1a] overflow-y-auto">

            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
              <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">

                {/* Left: title + view toggle */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm">📄</span>
                    <span className="text-sm font-bold text-slate-200 hidden sm:block">Resume</span>
                  </div>

                  {enhancedData && (
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-800 border border-slate-700">
                      <button
                        onClick={() => setResumeView("original")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          resumeView === "original" ? "bg-slate-700 text-slate-100 shadow shadow-black/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setResumeView("enhanced")}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          resumeView === "enhanced" ? "bg-emerald-500 text-white shadow shadow-emerald-500/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        ✨ Enhanced
                      </button>
                    </div>
                  )}

                  {resumeView === "enhanced" && enhancedData && (
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <span className="text-red-400 font-bold">{score}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-emerald-400 font-bold">{enhancedData?.atsScore ?? "~85"}</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5">
                        +{Math.max(0, (enhancedData?.atsScore ?? 85) - score)} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: close */}
                <button
                  onClick={() => setShowResumeTemplate(false)}
                  className="shrink-0 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-all"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-6">

              {/* Info banner when no enhanced data */}
              {!enhancedData && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-300 mb-0.5">Original Resume Data</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Extracted from your PDF. Edit any field inline, then download as PDF.
                      Want an AI-optimized version?{" "}
                      <button onClick={() => { setShowResumeTemplate(false); requestEnhance(); }} className="text-emerald-400 font-semibold underline underline-offset-2">Enhance with AI →</button>
                    </p>
                  </div>
                </div>
              )}

              {/* AI improvements list */}
              {resumeView === "enhanced" && enhancedData?.enhancements?.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3">✨ AI Improvements Applied</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(enhancedData.enhancements as string[]).slice(0, 8).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resume editor — full width, no card wrapper */}
              <ProfessionalResumeEditor
                key={resumeView}
                initialData={resumeView === "enhanced" && enhancedData ? enhancedData : sd}
                onSave={handleSaveResume}
                resumeId={result?.resumeId}
                isEnhanced={resumeView === "enhanced"}
                originalScore={score}
                enhancedScore={resumeView === "enhanced" ? (enhancedData?.atsScore ?? null) : null}
              />
            </div>
          </div>
        )}

        {/* ── VIEW HISTORY ── */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push(`/history?email=${encodeURIComponent(sd.email || "")}`)}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            View Resume History →
          </button>
        </div>
      </div>

      {/* ── JOB DESCRIPTION MODAL ── */}
      {showJdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowJdModal(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

          {/* Panel */}
          <div className="modal-in relative w-full max-w-lg rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/70 overflow-hidden">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✨</span>
                  <h2 className="text-lg font-bold text-white">Enhance Resume with AI</h2>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Paste the job description so AI can tailor your resume with the exact keywords and
                  requirements the employer is looking for.
                </p>
              </div>
              <button
                onClick={() => setShowJdModal(false)}
                className="shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Job Description
                  <span className="ml-2 text-xs font-normal text-slate-500">paste the full job posting</span>
                </label>
                <textarea
                  value={jobDescInput}
                  onChange={e => setJobDescInput(e.target.value)}
                  rows={8}
                  autoFocus
                  placeholder="Paste the job description here — AI will use it to inject the right keywords, rewrite your summary, and tailor your experience bullets to this specific role…"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all resize-none"
                />
                <p className="text-xs text-slate-600 mt-2">
                  Tip: a detailed job description produces significantly better keyword injection and a higher ATS score.
                </p>
              </div>

              {/* What AI will do */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 mb-2">AI will automatically:</p>
                <ul className="space-y-1">
                  {[
                    "Inject missing keywords from the job description",
                    "Rewrite your professional summary for this role",
                    "Strengthen experience bullets with action verbs & metrics",
                    "Align your skills section with required technologies",
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-emerald-400 shrink-0">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-7 pb-7">
              <button
                onClick={() => handleEnhance(jobDescInput)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[.98] transition-all text-white text-sm font-bold px-6 py-3.5 shadow-lg shadow-emerald-500/25"
              >
                ✨ Enhance My Resume →
              </button>
              <button
                onClick={() => setShowJdModal(false)}
                className="px-5 py-3.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
