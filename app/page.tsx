"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadStore } from "./upload-store";


/* ─────────────────────────────────────────────
   SCROLL-REVEAL HOOK
───────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────── */
function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800; const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          setVal(Math.round(e * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}


/* ─────────────────────────────────────────────
   FEATURE DATA
───────────────────────────────────────────── */
const FEATURES = [
  { icon:"🎯", title:"Instant ATS Score", desc:"0–100 score computed by GPT-4o against real ATS rubrics — keyword match, summary quality, experience depth, contact completeness, and more." },
  { icon:"🔑", title:"Critical Keyword Analysis", desc:"Every required skill and term from the job listing cross-referenced with your resume. Green for matched, amber for gaps — priority-ranked." },
  { icon:"📊", title:"Section-by-Section Breakdown", desc:"Individual scores for Contact, Summary, Experience, Skills, and Education with specific, actionable tips for each section." },
  { icon:"✨", title:"AI Resume Enhancement", desc:"GPT-4o rewrites your entire resume — tailored to the specific role — preserving your voice while maximizing every ATS signal." },
  { icon:"✏️", title:"Live Editable Template", desc:"A professional A4 template with your AI-enhanced content. Edit every field inline, then download as print-ready PDF." },
  { icon:"📁", title:"Full Resume History", desc:"Every analysis stored permanently under your email. Track score improvements over time and revisit any previous result." },
];

/* ─────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────── */
const TESTIMONIALS = [
  { name:"Priya Sharma", role:"Software Engineer → Google", avatar:"PS", score:91, prev:58, quote:"I was stuck at 58 on every application. ATSChecker showed me exactly which keywords I was missing. Two weeks later I had three interviews — including one at Google." },
  { name:"Marcus Reid", role:"Product Manager → Stripe", avatar:"MR", score:88, prev:44, quote:"My resume looked great but kept getting rejected. Turns out I was missing 12 critical keywords the ATS was filtering for. Fixed it in 20 minutes with the AI enhance." },
  { name:"Anika Patel", role:"Data Analyst → Netflix", avatar:"AP", score:94, prev:61, quote:"The section-by-section breakdown was eye-opening. My summary was scoring 38/100. The AI rewrote it and my callback rate jumped from under 5% to over 30% in a month." },
];

/* ─────────────────────────────────────────────
   PROCESS STEPS
───────────────────────────────────────────── */
const PROCESS_STEPS = [
  { n:"01", icon:"📄", title:"Upload Your Resume PDF", desc:"Simply drag and drop your resume PDF. We accept files up to 5MB. No account needed — your resume email becomes your identity." },
  { n:"02", icon:"🤖", title:"AI Scans & Scores Instantly", desc:"GPT-4o parses every section — contact info, experience, skills, education — and evaluates it against 6 weighted ATS rubrics in under 30 seconds." },
  { n:"03", icon:"📈", title:"Get Your Report & Enhance", desc:"Receive a detailed score breakdown, keyword gap analysis, and specific improvement suggestions. Then let AI rewrite your resume to a professional, editable template." },
];

/* ─────────────────────────────────────────────
   MOCK SCORE CARD (hero visual)
───────────────────────────────────────────── */
function MockScoreCard() {
  return (
    <div className="relative">
      {/* Floating accent cards */}
      <div className="absolute -top-4 -right-6 z-10 px-3 py-2 rounded-xl glass-card border border-emerald-500/30 shadow-lg shadow-emerald-500/10 scale-in" style={{ animationDelay:"600ms" }}>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm font-black">↑ 34 pts</span>
          <span className="text-slate-400 text-xs">after AI enhance</span>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-6 z-10 px-3 py-2 rounded-xl glass-card border border-blue-500/30 shadow-lg scale-in" style={{ animationDelay:"800ms" }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          <span className="text-slate-300 text-xs font-medium">Analyzed in 28s</span>
        </div>
      </div>

      {/* Main card */}
      <div className="glass-card rounded-3xl border border-slate-700/60 p-6 shadow-2xl shadow-black/60">
        {/* Scanner visual */}
        <div className="relative rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4 mb-5 overflow-hidden h-28">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="h-2.5 col-span-2 rounded bg-slate-700"/>
            <div className="h-2.5 rounded bg-slate-800"/>
          </div>
          {[1,.9,.8,.7,.95,.85,.75].map((w,i) => (
            <div key={i} className="mb-1.5 h-1.5 rounded" style={{ width:`${w*100}%`, background:"#1e293b" }}/>
          ))}
          <div className="absolute left-0 right-0 h-px pointer-events-none"
            style={{ animation:"scanBeamLoop 2.2s linear infinite", background:"linear-gradient(90deg,transparent,rgba(52,211,153,.95),transparent)", boxShadow:"0 0 12px 4px rgba(52,211,153,.3)" }}/>
        </div>

        {/* Score row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0" style={{ width:64, height:64 }}>
            <svg width="64" height="64" className="-rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="25" fill="none" stroke="#1e293b" strokeWidth="7"/>
              <circle cx="32" cy="32" r="25" fill="none" stroke="#10b981" strokeWidth="7"
                strokeDasharray={`${.82*157} ${.18*157}`} strokeLinecap="round"
                style={{ filter:"drop-shadow(0 0 5px rgba(16,185,129,.55))" }}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-emerald-400">82</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">ATS Score</p>
            <p className="text-base font-bold text-emerald-400">Good Match</p>
            <p className="text-xs text-slate-500 mt-0.5">↑ +34 pts available</p>
          </div>
        </div>

        {/* Bars */}
        {[
          { label:"Contact Info", val:100, c:"#10b981" },
          { label:"Keywords",    val:78,  c:"#10b981" },
          { label:"Experience",  val:88,  c:"#10b981" },
          { label:"Skills",      val:60,  c:"#f59e0b" },
          { label:"Summary",     val:36,  c:"#ef4444" },
        ].map(({ label, val, c }) => (
          <div key={label} className="mb-2">
            <div className="flex justify-between text-xs text-slate-400 mb-0.5">
              <span>{label}</span><span style={{ color:c }} className="font-semibold">{val}%</span>
            </div>
            <div className="h-1 rounded-full bg-slate-800">
              <div className="h-1 rounded-full" style={{ width:`${val}%`, background:c, boxShadow:`0 0 5px ${c}55` }}/>
            </div>
          </div>
        ))}

        {/* Keywords */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-2 font-medium">Matched keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {["React","TypeScript","Node.js","REST API","Agile"].map(k => (
              <span key={k} className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">{k}</span>
            ))}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">+5 missing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading">("idle");
  const [uploadProg, setUploadProg] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [exiting, setExiting] = useState(false);

  const uploadCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const startUpload = useCallback((chosen: File) => {
    if (chosen.type !== "application/pdf") { setError("Only PDF files are supported."); return; }
    if (chosen.size > 5 * 1024 * 1024) { setError("File too large — max 5 MB."); return; }
    setError(""); setUploadFile(chosen);
    uploadStore.setPendingFile(chosen);

    /* Kick off the API call immediately and store the promise */
    const fd = new FormData();
    fd.append("resume", chosen); fd.append("jobDescription", "");
    uploadStore.setPendingPromise(
      fetch("/api/analyze", { method: "POST", body: fd }).then(r => r.json())
    );

    setUploadProg(0); setPhase("uploading");
  }, []);

  /* Upload progress animation — when it hits 100%, animate out then navigate */
  useEffect(() => {
    if (phase !== "uploading") return;
    let cur = 0;
    const iv = setInterval(() => {
      cur += Math.max(0.6, (100 - cur) * 0.034);
      if (cur >= 99.5) {
        cur = 100; setUploadProg(100); clearInterval(iv);
        /* Slight pause to show checkmark, then exit animation */
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => router.push("/ats-score"), 600);
        }, 700);
      } else {
        setUploadProg(cur);
      }
    }, 40);
    return () => clearInterval(iv);
  }, [phase, router]);

  /* Section reveal hooks */
  const stats    = useReveal();
  const problem  = useReveal();
  const process  = useReveal();
  const features = useReveal();
  const testimonials = useReveal();
  const cta      = useReveal();

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden">

      {/* ════════════════════ GLOBAL STYLES ════════════════════ */}
      <style>{`
        /* Keyframes */
        @keyframes float        { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-16px)} }
        @keyframes shimmer      { 0%{background-position:-400% center} 100%{background-position:400% center} }
        @keyframes fadeUp       { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn      { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes slideRight   { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideLeft    { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scanBeamLoop { 0%{top:0%;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes blobDrift    { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.08)} 66%{transform:translate(-20px,20px) scale(.95)} }
        @keyframes uploadPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes uploadGlow   { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.0)} 50%{box-shadow:0 0 40px 4px rgba(16,185,129,.35)} }
        @keyframes checkPop     { 0%{transform:scale(0) rotate(-25deg);opacity:0} 65%{transform:scale(1.2) rotate(6deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes exitUp       { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-40px) scale(0.96)} }
        @keyframes particleUp   { 0%{transform:translateY(0) scale(1);opacity:.9} 100%{transform:translateY(-48px) scale(0);opacity:0} }
        @keyframes rotateSlow   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ping         { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
        @keyframes marquee      { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes gradientFlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes borderGlow   { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes numberPop    { 0%{transform:scale(.8);opacity:0} 100%{transform:scale(1);opacity:1} }

        /* Utilities */
        .anim-float     { animation: float 5s ease-in-out infinite; }
        .scale-in       { animation: scaleIn .55s cubic-bezier(.34,1.56,.64,1) both; }
        .fade-up        { animation: fadeUp .65s ease both; }
        .slide-right    { animation: slideRight .6s ease both; }
        .slide-left     { animation: slideLeft .6s ease both; }
        .slide-up       { animation: fadeUp .5s ease both; }

        .shimmer-text {
          background: linear-gradient(90deg,#34d399,#38bdf8,#818cf8,#c084fc,#f472b6,#34d399);
          background-size: 400% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 8s linear infinite;
        }
        .gradient-text {
          background: linear-gradient(135deg, #10b981, #14b8a6);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Glass card */
        .glass-card {
          background: rgba(15,23,42,.75);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
        }
        .glass-card-light {
          background: rgba(30,41,59,.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        /* Grid bg */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(148,163,184,.12) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        /* Glows */
        .glow-em  { box-shadow: 0 0 40px rgba(16,185,129,.12), 0 0 80px rgba(16,185,129,.04); }
        .glow-em:hover { box-shadow: 0 0 50px rgba(16,185,129,.22), 0 0 100px rgba(16,185,129,.07); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }

        /* Stagger helpers */
        .stagger-1 { animation-delay: 80ms; }
        .stagger-2 { animation-delay: 160ms; }
        .stagger-3 { animation-delay: 240ms; }
        .stagger-4 { animation-delay: 320ms; }
        .stagger-5 { animation-delay: 400ms; }
        .stagger-6 { animation-delay: 480ms; }
      `}</style>

      {/* ════════════════════ BACKGROUND ════════════════════ */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden dot-grid">
        {/* Color blobs */}
        <div style={{ animation:"blobDrift 18s ease-in-out infinite" }}
          className="absolute -top-96 -left-72 w-[900px] h-[900px] rounded-full bg-emerald-500 opacity-[.055] blur-[160px]"/>
        <div style={{ animation:"blobDrift 22s ease-in-out infinite 6s" }}
          className="absolute top-1/2 -right-72 w-[700px] h-[700px] rounded-full bg-violet-500 opacity-[.045] blur-[140px]"/>
        <div style={{ animation:"blobDrift 20s ease-in-out infinite 12s" }}
          className="absolute -bottom-60 left-1/3 w-[800px] h-[600px] rounded-full bg-blue-500 opacity-[.04] blur-[150px]"/>
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[.018]"
          style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat:"repeat", backgroundSize:"200px" }}/>
      </div>

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/40">
        <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-2xl"/>
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-900 font-black text-base shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow duration-300"
              style={{ background:"linear-gradient(135deg,#34d399,#0d9488)" }}>A</div>
            <span className="font-bold text-white text-lg tracking-tight">ATS<span className="gradient-text">Checker</span></span>
          </Link>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {[["#how-it-works","How It Works"],["#features","Features"],["#why-ats","Why ATS?"],["#testimonials","Success Stories"]].map(([href, label]) => (
              <a key={href} href={href}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 font-medium">
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="hidden sm:inline-flex text-sm text-slate-400 hover:text-white transition-colors font-medium">
              Dashboard
            </Link>
            <button
              onClick={() => uploadCardRef.current?.scrollIntoView({ behavior:"smooth", block:"center" })}
              className="inline-flex items-center gap-2 rounded-xl text-sm font-bold text-white px-4 py-2.5 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35"
              style={{ background:"linear-gradient(135deg,#10b981,#0d9488)" }}>
              Check Resume
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-28 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-20 items-center">

          {/* Left: Copy */}
          <div className="space-y-8" style={{ opacity:mounted?1:0, transform:mounted?"translateY(0)":"translateY(32px)", transition:"opacity .8s ease, transform .8s ease" }}>

            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-2 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"/>
              </span>
              Powered by GPT-4o · Trusted by 50,000+ job seekers
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl sm:text-6xl xl:text-[68px] font-extrabold tracking-tight leading-[1.03] text-white">
                Your Resume.
                <br/>
                <span className="shimmer-text">Fully Optimized.</span>
              </h1>
              <p className="mt-6 text-xl text-slate-400 leading-relaxed max-w-[520px]">
                75% of resumes are rejected before a human ever reads them.
                Upload yours and discover exactly why — then fix it in minutes with AI.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                {icon:"⚡", label:"Instant Score"},
                {icon:"🔑", label:"Keyword Analysis"},
                {icon:"🤖", label:"AI Rewrite"},
                {icon:"✏️", label:"Editable Template"},
                {icon:"📁", label:"Resume History"},
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/70 border border-slate-800 text-xs text-slate-400 font-medium">
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>

            {/* Social proof numbers */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div>
                <p className="text-2xl font-black text-white">50K+</p>
                <p className="text-xs text-slate-500 mt-0.5">Resumes analyzed</p>
              </div>
              <div className="w-px h-10 bg-slate-800"/>
              <div>
                <p className="text-2xl font-black text-emerald-400">+40%</p>
                <p className="text-xs text-slate-500 mt-0.5">Avg. score boost</p>
              </div>
              <div className="w-px h-10 bg-slate-800"/>
              <div>
                <p className="text-2xl font-black text-white">98%</p>
                <p className="text-xs text-slate-500 mt-0.5">User satisfaction</p>
              </div>
            </div>

            {/* Floating mock card (desktop) */}
            <div className="anim-float hidden xl:block px-6 py-4" style={{ opacity:mounted?1:0, transition:"opacity .8s ease .5s" }}>
              <MockScoreCard/>
            </div>
          </div>

          {/* Right: Upload panel */}
          <div ref={uploadCardRef}
            style={{
              opacity: mounted ? 1 : 0,
              transition: exiting
                ? "opacity .6s ease, transform .6s ease"
                : "opacity .8s ease .3s",
              ...(exiting ? { opacity: 0, transform: "translateY(-40px) scale(0.96)" } : {}),
            }}>

            {/* ── UPLOADING: Progress ring ── */}
            {phase === "uploading" && uploadFile && (
              <div className="glass-card rounded-3xl border border-slate-700/50 p-8 shadow-2xl shadow-black/60 scale-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white">Uploading Resume</h2>
                  <p className="text-sm text-slate-400 mt-1">Securely transmitting to our servers…</p>
                </div>
                {(() => {
                  const sz = 168, r = 65, circ = 2 * Math.PI * r;
                  const done = uploadProg >= 100;
                  return (
                    <div className="flex flex-col items-center gap-7">
                      <div className="relative" style={{ width:sz, height:sz }}>
                        <div className="absolute inset-0 rounded-full" style={{ boxShadow:`0 0 ${done?60:35}px rgba(16,185,129,${done?.55:.22})`, transition:"box-shadow .7s ease" }}/>
                        <div className="absolute inset-[-6px] rounded-full opacity-30"
                          style={{ border:"1px dashed rgba(16,185,129,.4)", animation:"rotateSlow 8s linear infinite" }}/>
                        <svg width={sz} height={sz} className="-rotate-90" viewBox={`0 0 ${sz} ${sz}`}>
                          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#1e293b" strokeWidth="10"/>
                          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#10b981" strokeWidth="10"
                            strokeDasharray={circ} strokeDashoffset={circ-(uploadProg/100)*circ} strokeLinecap="round"
                            style={{ filter:"drop-shadow(0 0 10px rgba(16,185,129,.65))", transition:"stroke-dashoffset .08s linear" }}/>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {done ? (
                            <span className="text-5xl" style={{ animation:"checkPop .5s cubic-bezier(.34,1.56,.64,1) both" }}>✅</span>
                          ) : (
                            <>
                              <span className="text-3xl font-black text-emerald-400 tabular-nums">{Math.round(uploadProg)}%</span>
                              <span className="text-xs text-slate-500 mt-1 font-medium">uploading</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center mb-1.5">
                          <span className="text-xl">📄</span>
                          <p className="text-sm font-semibold text-slate-200 max-w-[230px] truncate">{uploadFile.name}</p>
                        </div>
                        <p className="text-xs text-slate-500">{(uploadFile.size/1024/1024).toFixed(2)} MB · PDF</p>
                      </div>
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-2">
                          <span className={uploadProg>=100?"text-emerald-400":"text-slate-500"}>{uploadProg>=100?"Upload complete!":"Uploading resume…"}</span>
                          <span className="text-emerald-400 font-bold tabular-nums">{Math.round(uploadProg)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${uploadProg}%`, background:"linear-gradient(90deg,#10b981,#14b8a6,#34d399)", boxShadow:"0 0 12px rgba(16,185,129,.55)", transition:"width .08s linear" }}/>
                        </div>
                        {uploadProg >= 100 && (
                          <p className="text-xs text-emerald-400 text-center mt-2.5 font-medium" style={{ animation:"fadeUp .4s ease both" }}>
                            Starting AI analysis…
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── IDLE: Drop zone ── */}
            {phase === "idle" && (
            <div className="glass-card rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/60 glow-em overflow-hidden scale-in">
                {/* Header */}
                <div className="px-7 pt-7 pb-5 border-b border-slate-800/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                      Free · Instant · No account needed
                    </div>
                    <div className="flex gap-1.5">
                      {["bg-red-500","bg-amber-500","bg-emerald-500"].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c} opacity-60`}/>)}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Upload Your Resume</h2>
                  <p className="text-sm text-slate-400 mt-1">Drop your PDF — analysis starts automatically</p>
                </div>

                {/* Drop zone */}
                <div className="p-7">
                  <label
                    className={`relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden ${
                      dragOver
                        ? "border-emerald-400 bg-emerald-500/10 shadow-[inset_0_0_60px_rgba(16,185,129,.06)]"
                        : "border-slate-700/80 bg-slate-900/30 hover:border-emerald-500/50 hover:bg-emerald-500/4"
                    }`}
                    style={{ minHeight:280 }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) startUpload(f); }}>
                    <input type="file" accept="application/pdf" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) startUpload(f); }}/>

                    {/* Animated corner accents */}
                    {dragOver && (
                      <>
                        {[["top-2 left-2","border-t-2 border-l-2"],["top-2 right-2","border-t-2 border-r-2"],["bottom-2 left-2","border-b-2 border-l-2"],["bottom-2 right-2","border-b-2 border-r-2"]].map(([pos, b]) => (
                          <div key={pos} className={`absolute ${pos} ${b} w-5 h-5 border-emerald-400 rounded-sm`}/>
                        ))}
                      </>
                    )}

                    <div className="flex flex-col items-center gap-6 py-12 px-8 text-center select-none">
                      {/* Icon */}
                      <div className="relative" style={{ width:84, height:84 }}>
                        <div className="absolute inset-0 rounded-2xl"
                          style={{ background: dragOver?"rgba(16,185,129,.18)":"rgba(15,23,42,.9)", border:`2px solid ${dragOver?"rgba(16,185,129,.5)":"rgba(51,65,85,.5)"}`, animation:dragOver?"uploadGlow 1s ease-in-out infinite":"none", transition:"all .3s ease" }}/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl" style={{ animation:dragOver?"uploadPulse .8s ease-in-out infinite":"none" }}>
                            {dragOver ? "📂" : "📄"}
                          </span>
                        </div>
                        {dragOver && [
                          { top:"2px", right:"2px", size:"8px", color:"#34d399", delay:"0s" },
                          { top:"14px", left:"4px", size:"6px", color:"#14b8a6", delay:".3s" },
                          { bottom:"4px", right:"10px", size:"5px", color:"#6ee7b7", delay:".6s" },
                        ].map((p, i) => (
                          <span key={i} className="absolute rounded-full"
                            style={{ top:p.top, right:p.right, bottom:p.bottom, left:p.left, width:p.size, height:p.size, background:p.color, animation:`particleUp 1s ease-out ${p.delay} infinite` }}/>
                        ))}
                      </div>

                      {/* Text */}
                      <div>
                        <p className="text-lg font-semibold text-slate-200 mb-2">
                          {dragOver ? "Release to analyze" : "Drag & drop your resume"}
                        </p>
                        <p className="text-sm text-slate-500">
                          or <span className="text-emerald-400 font-semibold underline underline-offset-2 decoration-dotted cursor-pointer">click to browse files</span>
                        </p>
                        <p className="text-xs text-slate-600 mt-4">PDF only · max 5 MB · starts automatically</p>
                      </div>

                      {/* Format badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-800/70 border border-slate-700/60">
                          <span className="w-4 h-4 rounded flex items-center justify-center text-white text-[9px] font-black" style={{ background:"#dc2626" }}>PDF</span>
                          <span className="text-xs text-slate-500">Supported format</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-800/70 border border-slate-700/60">
                          <span className="text-emerald-400 text-xs">🔒</span>
                          <span className="text-xs text-slate-500">Encrypted</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Error */}
                  {error && (
                    <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/8 px-4 py-3 text-sm text-red-300 flex items-start gap-2.5">
                      <span className="shrink-0 mt-0.5 text-red-400">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <p className="text-xs text-center text-slate-600 mt-5">
                    Your data is analyzed securely · email in resume = your identity · no login needed
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS TICKER ════════════════════ */}
      <div ref={stats.ref} className={`relative z-10 border-y border-slate-800/50 bg-slate-900/25 py-12 overflow-hidden transition-all duration-700 ${stats.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-6"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val:50000, sfx:"+", label:"Resumes Analyzed", color:"text-emerald-400" },
              { val:40,    sfx:"%", label:"Avg. Score Boost",  color:"text-violet-400", pre:"+" },
              { val:200,   sfx:"+", label:"ATS Keywords Tracked", color:"text-blue-400" },
              { val:98,    sfx:"%", label:"User Satisfaction", color:"text-amber-400" },
            ].map(({ val, sfx, label, color, pre }) => (
              <div key={label} className="group">
                <p className={`text-4xl font-black ${color} group-hover:scale-105 transition-transform duration-200 tabular-nums`}>
                  <Counter to={val} suffix={sfx} prefix={pre}/>
                </p>
                <p className="text-sm text-slate-500 mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════ PROBLEM SECTION ════════════════════ */}
      <section id="why-ats" ref={problem.ref} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-28">
        <div className={`text-center mb-16 transition-all duration-700 ${problem.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/8 px-4 py-2 text-xs font-semibold text-red-400 mb-6">
            ⚠ The Hidden Problem
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Your resume is being<br/>
            <span className="shimmer-text">rejected before anyone reads it</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Applicant Tracking Systems automatically filter resumes based on keyword matching and
            formatting rules — before a single recruiter ever sees your application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { stat:"75%", color:"text-red-400", border:"border-red-500/20", bg:"bg-red-500/4", icon:"🚫",
              label:"of resumes are auto-rejected", desc:"Three out of four applications are filtered out by ATS before reaching a human — even when the candidate is perfectly qualified for the role." },
            { stat:"98%", color:"text-amber-400", border:"border-amber-500/20", bg:"bg-amber-500/4", icon:"🏢",
              label:"of Fortune 500s use ATS", desc:"Every major employer runs automated screening. An un-optimized resume will disappear silently — no feedback, no callback, no chance." },
            { stat:"2×",  color:"text-emerald-400", border:"border-emerald-500/20", bg:"bg-emerald-500/4", icon:"📈",
              label:"more interviews with optimization", desc:"Candidates who tailor their resumes to ATS standards consistently double their interview callback rate within the first month." },
          ].map(({ stat, color, border, bg, icon, label, desc }, i) => (
            <div key={stat}
              className={`rounded-3xl border p-8 ${border} ${bg} hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${problem.visible?"fade-up":"opacity-0"}`}
              style={{ animationDelay:`${i*120}ms` }}>
              <div className="text-3xl mb-4">{icon}</div>
              <p className={`text-6xl font-black ${color} mb-3 leading-none`}>{stat}</p>
              <p className="text-base font-bold text-slate-200 mb-3">{label}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS ════════════════════ */}
      <section id="how-it-works" className="relative z-10 border-y border-slate-800/50">
        <div className="absolute inset-0 bg-slate-900/20"/>
        <div ref={process.ref} className="relative max-w-7xl mx-auto px-5 sm:px-8 py-28">
          <div className={`text-center mb-16 transition-all duration-700 ${process.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-2 text-xs font-semibold text-emerald-400 mb-6">
              ⚡ How It Works
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">From upload to ATS-ready<br/>in under 60 seconds</h2>
            <p className="text-xl text-slate-400 max-w-xl mx-auto">No account. No waiting. Just results.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
            {PROCESS_STEPS.map(({ n, icon, title, desc }, i) => (
              <div key={n} className={`relative group ${process.visible?"fade-up":"opacity-0"}`} style={{ animationDelay:`${i*140}ms` }}>
                {/* Connector line */}
                {i < 2 && <div className="hidden lg:block absolute top-10 left-[calc(100%+0px)] w-full h-px z-10" style={{ width:"calc(100% - 0px)", left:"calc(50% + 40px)", top:"40px", right:"-50%" }}>
                  <div className="h-px w-full bg-gradient-to-r from-slate-700 to-transparent"/>
                </div>}

                <div className="glass-card-light rounded-3xl border border-slate-700/50 p-8 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-400 group-hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background:"linear-gradient(135deg,rgba(16,185,129,.15),rgba(13,148,136,.1))", border:"1px solid rgba(16,185,129,.25)" }}>
                      {icon}
                    </div>
                    <span className="text-5xl font-black text-slate-800 group-hover:text-slate-700 transition-colors tabular-nums">{n}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-16 text-center transition-all duration-700 delay-500 ${process.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-6"}`}>
            <button
              onClick={() => uploadCardRef.current?.scrollIntoView({ behavior:"smooth", block:"center" })}
              className="inline-flex items-center gap-3 rounded-2xl text-base font-bold text-white px-8 py-4 shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-200"
              style={{ background:"linear-gradient(135deg,#10b981,#0d9488)" }}>
              Analyze My Resume Now →
            </button>
            <p className="text-xs text-slate-600 mt-4">No credit card · No account · 100% free</p>
          </div>
        </div>
      </section>

      {/* ════════════════════ FEATURES ════════════════════ */}
      <section id="features" ref={features.ref} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-28">
        <div className={`text-center mb-16 transition-all duration-700 ${features.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/8 px-4 py-2 text-xs font-semibold text-violet-400 mb-6">
            🛠 Everything Included
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">The complete resume toolkit</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to understand, improve, and land your resume past every ATS filter.
            No separate tools, no subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, desc }, i) => (
            <div key={title}
              className={`group glass-card-light rounded-2xl border border-slate-800/80 p-7 hover:border-emerald-500/35 hover:bg-slate-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 ${features.visible?"fade-up":"opacity-0"}`}
              style={{ animationDelay:`${i*80}ms` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300"
                style={{ background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.2)" }}>
                {icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2.5">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ TESTIMONIALS ════════════════════ */}
      <section id="testimonials" className="relative z-10 border-y border-slate-800/50">
        <div className="absolute inset-0 bg-slate-900/20"/>
        <div ref={testimonials.ref} className="relative max-w-7xl mx-auto px-5 sm:px-8 py-28">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonials.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/8 px-4 py-2 text-xs font-semibold text-amber-400 mb-6">
              ⭐ Success Stories
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">Job seekers who beat the ATS</h2>
            <p className="text-xl text-slate-400 max-w-xl mx-auto">Real results from real people who used ATSChecker to land their dream roles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, avatar, score, prev, quote }, i) => (
              <div key={name}
                className={`glass-card rounded-3xl border border-slate-700/50 p-7 hover:border-slate-700 hover:shadow-xl transition-all duration-400 hover:-translate-y-1 ${testimonials.visible?"fade-up":"opacity-0"}`}
                style={{ animationDelay:`${i*120}ms` }}>
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_,j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6 italic">"{quote}"</p>

                {/* Score improvement */}
                <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Before</p>
                    <p className="text-xl font-black text-red-400">{prev}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-px flex-1 bg-gradient-to-r from-red-500 to-emerald-500"/>
                    <span className="text-xs text-emerald-400 font-bold shrink-0">+{score - prev} pts</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500 to-emerald-500"/>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">After</p>
                    <p className="text-xl font-black text-emerald-400">{score}</p>
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-slate-900 shrink-0"
                    style={{ background:"linear-gradient(135deg,#10b981,#0d9488)" }}>
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs text-emerald-400 font-medium">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ WHAT YOU GET ════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/8 px-4 py-2 text-xs font-semibold text-blue-400 mb-6">
              📋 Detailed Analysis
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
              A complete report,<br/>
              <span className="gradient-text">not just a number</span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Unlike simple keyword checkers, we give you a complete picture of your resume's
              ATS performance — and tell you exactly what to change and how to change it.
            </p>
            <ul className="space-y-4">
              {[
                ["📌", "Contact completeness — every missing field individually flagged"],
                ["🎯", "Matched vs. missing critical keywords listed side by side"],
                ["💪", "Specific strengths identified — so you know what to keep"],
                ["⚠️", "Improvement suggestions in plain English, zero jargon"],
                ["🤖", "GPT-4o rewrites your entire resume for the specific job role"],
                ["🖊️", "Fully editable A4 template — tweak every field before downloading"],
              ].map(([icon, text]) => (
                <li key={String(text)} className="flex items-start gap-3 group">
                  <span className="text-xl shrink-0 group-hover:scale-110 transition-transform duration-200">{icon}</span>
                  <span className="text-slate-300 text-sm leading-relaxed group-hover:text-slate-200 transition-colors">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Mock report */}
          <div className="glass-card rounded-3xl border border-slate-700/50 p-7 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold text-slate-200">Sample ATS Report</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 font-bold">82 / 100</span>
                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1 font-medium">Good</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { section:"Contact Information",  score:100, grade:"A", color:"#10b981" },
                { section:"Professional Summary", score:42,  grade:"F", color:"#ef4444" },
                { section:"Work Experience",      score:90,  grade:"A", color:"#10b981" },
                { section:"Education",            score:85,  grade:"B", color:"#10b981" },
                { section:"Technical Skills",     score:62,  grade:"C", color:"#f59e0b" },
                { section:"Keyword Match",        score:78,  grade:"B", color:"#10b981" },
              ].map(({ section, score, grade, color }) => (
                <div key={section} className="rounded-xl bg-slate-950/50 border border-slate-800/60 px-4 py-3 hover:border-slate-700/60 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-300">{section}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold rounded px-1.5 py-0.5" style={{ color, background:`${color}18`, border:`1px solid ${color}30` }}>{grade}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}%</span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800">
                    <div className="h-1 rounded-full" style={{ width:`${score}%`, background:color, boxShadow:`0 0 5px ${color}50` }}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500">4 improvements recommended</p>
              <span className="text-xs text-violet-400 font-medium">Fix all with AI →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FINAL CTA ════════════════════ */}
      <section ref={cta.ref} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-28">
        <div className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${cta.visible?"opacity-100 translate-y-0":"opacity-0 translate-y-10"}`}>
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-violet-950/40"/>
          <div className="absolute inset-0" style={{ background:"linear-gradient(135deg,rgba(16,185,129,.06),rgba(139,92,246,.06))", animation:"gradientFlow 8s ease-in-out infinite", backgroundSize:"200% 200%" }}/>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"/>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"/>
          <div className="absolute top-px inset-x-0 border border-slate-700/30 rounded-3xl pointer-events-none"/>

          <div className="relative px-8 sm:px-16 py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/8 px-4 py-2 text-xs font-semibold text-emerald-400 mb-8">
              🎯 Free · Instant · No signup required
            </div>
            <h2 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white mb-6 leading-tight">
              Ready to beat the ATS<br/>
              <span className="shimmer-text">and land your dream role?</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Join 50,000+ job seekers who've optimized their resumes with ATSChecker.
              Upload your resume right here — results in under 30 seconds, completely free.
            </p>
            <button
              onClick={() => uploadCardRef.current?.scrollIntoView({ behavior:"smooth", block:"center" })}
              className="inline-flex items-center gap-3 rounded-2xl text-lg font-bold text-white px-10 py-5 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/45 transition-all duration-200 hover:scale-[1.02]"
              style={{ background:"linear-gradient(135deg,#10b981,#0d9488)" }}>
              Check My Resume Now — It's Free →
            </button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              {["🔒 Encrypted upload","📄 PDF supported","⚡ Results in 30s","🚫 No credit card","👤 No account needed"].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="relative z-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-900 font-black text-sm"
                style={{ background:"linear-gradient(135deg,#34d399,#0d9488)" }}>A</div>
              <div>
                <p className="font-bold text-white text-sm">ATS<span className="gradient-text">Checker</span></p>
                <p className="text-xs text-slate-600">AI-Powered Resume Optimization</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <button onClick={() => uploadCardRef.current?.scrollIntoView({ behavior:"smooth", block:"center" })}
                className="hover:text-slate-300 transition-colors">Check Resume</button>
              <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
              <Link href="/history"   className="hover:text-slate-300 transition-colors">History</Link>
              <Link href="/upload"    className="hover:text-slate-300 transition-colors">Upload Page</Link>
            </div>

            {/* Right */}
            <p className="text-xs text-slate-700">© 2025 ATSChecker. Built with GPT-4o.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
