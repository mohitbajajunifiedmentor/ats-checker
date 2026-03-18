"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KeywordAnalysis from "@/components/KeywordAnalysis";
import ProfessionalResumeEditor from "@/components/ProfessionalResumeEditor";

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
   Section grade card
───────────────────────────────────────────────────── */
type GradeStatus = "good" | "fair" | "poor" | "missing";

function SectionCard({
  icon,
  title,
  status,
  score,
  tip,
  detail,
}: {
  icon: string;
  title: string;
  status: GradeStatus;
  score: number;
  tip: string;
  detail: string;
}) {
  const [open, setOpen] = useState(false);

  const cfg: Record<GradeStatus, { label: string; textColor: string; barColor: string; badge: string }> = {
    good:    { label: "Good",    textColor: "text-emerald-400", barColor: "bg-emerald-500", badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
    fair:    { label: "Fair",    textColor: "text-amber-400",   barColor: "bg-amber-500",   badge: "bg-amber-500/15 border-amber-500/30 text-amber-400" },
    poor:    { label: "Needs Work", textColor: "text-red-400",  barColor: "bg-red-500",     badge: "bg-red-500/15 border-red-500/30 text-red-400" },
    missing: { label: "Missing", textColor: "text-slate-400",   barColor: "bg-slate-600",   badge: "bg-slate-700/50 border-slate-600 text-slate-400" },
  };
  const { label, textColor, barColor, badge } = cfg[status];

  return (
    <div
      className={`rounded-2xl border bg-slate-900/60 overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg ${
        status === "good"
          ? "border-emerald-500/20 hover:border-emerald-500/40"
          : status === "fair"
          ? "border-amber-500/20 hover:border-amber-500/40"
          : status === "poor"
          ? "border-red-500/20 hover:border-red-500/40"
          : "border-slate-700 hover:border-slate-600"
      }`}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-200">{title}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>
                {label}
              </span>
            </div>
          </div>
          <span className={`text-sm font-bold flex-shrink-0 ${textColor}`}>{score}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Quick tip (always visible) */}
        <p className="mt-3 text-xs text-slate-400 leading-relaxed">{tip}</p>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className={`border-t px-5 py-4 text-xs leading-relaxed ${
          status === "good" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"
          : status === "fair" ? "border-amber-500/20 bg-amber-500/5 text-amber-200"
          : status === "poor" ? "border-red-500/20 bg-red-500/5 text-red-200"
          : "border-slate-700 bg-slate-800/30 text-slate-300"
        }`}>
          {detail}
        </div>
      )}
    </div>
  );
}

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
function buildImprovements(structuredData: any, analysis: any, sections: ReturnType<typeof buildSections>) {
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
export default function AtsScorePage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [phase, setPhase] = useState<"loading" | "results" | "enhancing" | "enhanced">("loading");
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<"overview" | "keywords" | "improve" | "resume">("overview");
  const [resumeView, setResumeView]       = useState<"original" | "enhanced">("original");

  useEffect(() => {
    const stored = window.localStorage.getItem("atsAnalyzeResult");
    if (!stored) { router.replace("/upload"); return; }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.success) throw new Error("invalid");
      setResult(parsed);
      setPhase("results");
    } catch { router.replace("/upload"); }
  }, [router]);

  const handleEnhance = async () => {
    if (!result) return;
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
          jobDescription: result.jobDescription || "",
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
        setActiveSection("resume");
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mb-6">
            <span className="text-3xl" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>✨</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-50 mb-2">Enhancing Your Resume</h2>
          <p className="text-slate-400 text-sm mb-8">
            AI is rewriting your resume to align with the job description and inject missing keywords. Takes 15–30 seconds.
          </p>
          <div className="space-y-3 text-left mb-8">
            {[
              { label: "Analyzing job requirements",           done: enhanceProgress > 15 },
              { label: "Rewriting professional summary",       done: enhanceProgress > 32 },
              { label: "Optimizing experience bullet points",  done: enhanceProgress > 52 },
              { label: "Injecting missing keywords",           done: enhanceProgress > 70 },
              { label: "Finalizing enhanced resume",           done: enhanceProgress >= 100 },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-500 ${done ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-slate-700"}`}>
                  {done && <span className="text-xs">✓</span>}
                </div>
                <span className={`text-sm ${done ? "text-emerald-300" : "text-slate-500"}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${enhanceProgress}%`, background: "linear-gradient(90deg,#10b981,#14b8a6)" }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{Math.round(enhanceProgress)}% complete</p>
        </div>
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
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-10">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Top nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">← Home</button>
          <button
            onClick={() => { window.localStorage.removeItem("atsAnalyzeResult"); router.push("/upload"); }}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 rounded-lg px-4 py-2 hover:border-slate-600"
          >
            Upload New Resume
          </button>
        </div>

        {/* ── HERO SCORE CARD ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-8">

            {/* Ring */}
            <div className="relative flex-shrink-0">
              <ScoreRing score={score} size={140} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className={`text-4xl font-black ${scoreColor}`}>
                  <AnimatedScore target={score} />
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 text-center md:text-left">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold mb-3 ${scoreBg}`}>
                {scoreLabel}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-5 max-w-lg">{scoreAdvice}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400">{(analysis.matchedKeywords || []).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Keywords Matched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-400">{(analysis.missingKeywords || []).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Keywords Missing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-400">{(sd.skills || []).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Skills Detected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-purple-400">{(sd.experience || []).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Roles Found</p>
                </div>
              </div>
            </div>

            {/* Gauge columns (desktop) */}
            <div className="hidden lg:flex flex-col gap-2 w-40 flex-shrink-0">
              {sections.map((s) => (
                <div key={s.title}>
                  <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                    <span className="truncate">{s.title.split(" ")[0]}</span>
                    <span>{s.score}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800">
                    <div
                      className={`h-1 rounded-full transition-all duration-1000 ${
                        s.status === "good" ? "bg-emerald-500" : s.status === "fair" ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 w-fit">
          {(["overview", "keywords", "improve", "resume"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeSection === tab
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "overview" ? "📊 Overview" : tab === "keywords" ? "🔑 Keywords" : tab === "improve" ? "⚡ Improvements" : "📄 Resume Template"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-1">Section Breakdown</h2>
              <p className="text-sm text-slate-400 mb-5">
                Click any card to see detailed guidance. Green = passing ATS threshold, Amber = needs improvement, Red = critical issue.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((s) => (
                  <SectionCard key={s.title} {...s} />
                ))}
              </div>
            </div>

            {/* Extracted data preview */}
            {(sd.name || sd.email || (sd.skills || []).length > 0) && (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-7">
                <h2 className="text-lg font-bold text-slate-50 mb-4">What We Extracted From Your Resume</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    {[
                      { label: "Name",     val: sd.name },
                      { label: "Email",    val: sd.email },
                      { label: "Phone",    val: sd.phone },
                      { label: "Location", val: sd.address },
                      { label: "LinkedIn", val: sd.linkedin },
                      { label: "GitHub",   val: sd.github },
                    ].filter(({ val }) => val).map(({ label, val }) => (
                      <div key={label} className="flex gap-3 items-start">
                        <span className="text-xs text-slate-500 w-16 flex-shrink-0 pt-0.5 font-medium">{label}</span>
                        <span className="text-sm text-slate-300 break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                  {sd.summary && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</p>
                      <p className="text-sm text-slate-300 leading-relaxed line-clamp-5">{sd.summary}</p>
                    </div>
                  )}
                </div>

                {(sd.skills || []).length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Skills Detected ({sd.skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sd.skills.slice(0, 24).map((skill: string, i: number) => (
                        <span key={i} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">{skill}</span>
                      ))}
                      {sd.skills.length > 24 && <span className="text-xs text-slate-500 self-center">+{sd.skills.length - 24} more</span>}
                    </div>
                  </div>
                )}

                {(sd.education || []).length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Education</p>
                    <div className="space-y-1">
                      {sd.education.map((edu: any, i: number) => (
                        <p key={i} className="text-sm text-slate-300">
                          <span className="font-medium">{edu.degree}</span>
                          {edu.institution && <span className="text-slate-400"> · {edu.institution}</span>}
                          {edu.year && <span className="text-slate-500"> ({edu.year})</span>}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {(sd.experience || []).length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Experience</p>
                    <div className="space-y-2">
                      {sd.experience.map((exp: any, i: number) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-emerald-400 mt-1 text-xs flex-shrink-0">▸</span>
                          <div>
                            <span className="text-sm font-medium text-slate-200">{exp.title}</span>
                            {exp.company && <span className="text-sm text-slate-400"> at {exp.company}</span>}
                            {exp.duration && <span className="text-xs text-slate-500"> ({exp.duration})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strengths & suggestions */}
            {((analysis.strengths || []).length > 0 || (analysis.suggestions || []).length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(analysis.strengths || []).length > 0 && (
                  <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-6">
                    <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2">✓ Strengths</h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-emerald-400 flex-shrink-0 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(analysis.suggestions || []).length > 0 && (
                  <div className="rounded-3xl border border-amber-500/20 bg-slate-900/60 p-6">
                    <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">⚠ Suggestions</h3>
                    <ul className="space-y-2">
                      {analysis.suggestions.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-400 flex-shrink-0 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── KEYWORDS TAB ── */}
        {activeSection === "keywords" && (
          <KeywordAnalysis
            matchedKeywords={analysis.matchedKeywords || []}
            missingKeywords={analysis.missingKeywords || []}
          />
        )}

        {/* ── IMPROVEMENTS TAB ── */}
        {activeSection === "improve" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-1">What to Add to Your Resume</h2>
              <p className="text-sm text-slate-400 mb-5">
                These are the specific changes that will have the biggest impact on your ATS score. Address High impact items first.
              </p>
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

            {/* Missing keywords detail */}
            {(analysis.missingKeywords || []).length > 0 && (
              <div className="rounded-3xl border border-amber-500/20 bg-slate-900/60 p-6">
                <h3 className="text-base font-bold text-amber-400 mb-3">⚠ Missing Keywords — Add These to Your Resume</h3>
                <p className="text-xs text-slate-400 mb-4">
                  These words appear in the job description but not in your resume. Adding them (where truthful) will directly boost your keyword match score.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(analysis.missingKeywords || []).map((kw: string, i: number) => (
                    <span key={i} className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-3 py-1.5 rounded-full font-medium">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESUME TEMPLATE TAB ── */}
        {activeSection === "resume" && (
          <div className="space-y-5">

            {/* ── View toggle (shown when enhanced data is available) ── */}
            {enhancedData ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800 border border-slate-700">
                  <button
                    onClick={() => setResumeView("original")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      resumeView === "original"
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    📄 Original
                  </button>
                  <button
                    onClick={() => setResumeView("enhanced")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      resumeView === "enhanced"
                        ? "bg-emerald-500 text-white shadow shadow-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ✨ Enhanced Resume
                  </button>
                </div>

                {resumeView === "enhanced" && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Score:</span>
                    <span className="text-sm font-bold text-red-400">{score}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-sm font-bold text-emerald-400">{enhancedData?.atsScore ?? "~85"}</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2 py-0.5">
                      +{Math.max(0, (enhancedData?.atsScore ?? 85) - score)} pts
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* No enhanced data yet — show prompt banner */
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-300 mb-0.5">Your Resume — Original Data</p>
                  <p className="text-xs text-slate-400">
                    Extracted from your uploaded resume. Edit and download as PDF. For an AI-optimized version click{" "}
                    <strong className="text-emerald-400">Enhance with AI</strong>.
                  </p>
                </div>
                <button
                  onClick={handleEnhance}
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 transition-colors text-white text-xs font-bold px-4 py-2 rounded-full"
                >
                  ✨ Enhance with AI
                </button>
              </div>
            )}

            {/* ── AI enhancements list (when enhanced view is active) ── */}
            {resumeView === "enhanced" && enhancedData?.enhancements?.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="text-sm font-bold text-emerald-400 mb-3">✨ AI Improvements Applied</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {enhancedData.enhancements.slice(0, 8).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Resume editor ── */}
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
        )}

        {/* ── ACTION SECTION ── */}
        <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-900/80 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-50">What would you like to do next?</h2>
            <p className="text-slate-400 text-sm mt-2">
              Let AI apply all the improvements automatically, or upload a different resume.
            </p>
          </div>

          {enhanceError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-6 text-center">⚠ {enhanceError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleEnhance}
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

        <div className="flex justify-center">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            View Resume History →
          </button>
        </div>
      </div>
    </main>
  );
}
