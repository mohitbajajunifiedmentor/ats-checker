"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── animated counter (viewport-triggered) ── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setVal(Math.round(p * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  return (
    <div
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="text-sm font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ n, title, desc, icon }: { n: string; title: string; desc: string; icon: string }) {
  return (
    <div className="flex gap-5 items-start group">
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <div>
        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Step {n}</span>
        <h3 className="text-base font-bold text-slate-100 mb-1 mt-0.5">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">

      <style>{`
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes scanBeam { 0%{top:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes pulseRing{ 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.5);opacity:0} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .anim-float  { animation: float 4s ease-in-out infinite; }
        .scan-beam   { animation: scanBeam 2.6s linear infinite; position:absolute;left:0;right:0;height:2px;pointer-events:none; }
        .pulse-ring  { animation: pulseRing 2.4s ease-out infinite; }
        .shimmer-txt {
          background: linear-gradient(90deg,#34d399,#38bdf8,#818cf8,#34d399);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[100px]" />
        <div className="absolute top-60 -right-40 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[400px] rounded-full bg-indigo-600/8 blur-[120px]" />
      </div>

      {/* ─── NAV ─────────────────────────────────────── */}
      <nav className="relative z-20 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-900 font-black text-sm">A</div>
            <span className="font-bold text-slate-100">ATSChecker</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#how-it-works" className="hover:text-slate-100 transition-colors">How it works</a>
            <a href="#features"     className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#why-ats"      className="hover:text-slate-100 transition-colors">Why ATS?</a>
          </div>
          <Link href="/upload" className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2 transition-colors">
            Check Resume →
          </Link>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* left */}
        <div
          className="space-y-7"
          style={{
            opacity:    mounted ? 1 : 0,
            transform:  mounted ? "translateY(0)" : "translateY(24px)",
            transition: "opacity .7s ease, transform .7s ease",
            transitionDelay: "100ms",
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered ATS Resume Checker
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            Beat the ATS.
            <span className="block shimmer-txt mt-1">Get More Interviews.</span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
            Upload your resume, paste a job description, and instantly discover how ATS systems score
            you — then let AI rewrite it to pass every filter.
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {["Instant ATS Score","Keyword Gap Analysis","Section Breakdown","AI Enhancement","Editable Template","Resume History"].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors">{tag}</span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400 transition-all duration-200"
            >
              Check My Resume →
            </Link>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              See how it works ↓
            </a>
          </div>
          <p className="text-xs text-slate-600">No account needed · Your resume email = your identity · Free</p>
        </div>

        {/* right — animated mock score card */}
        <div
          className="anim-float"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity .7s ease", transitionDelay: "350ms" }}
        >
          <div className="relative mx-auto max-w-sm">
            <div className="pulse-ring absolute inset-4 rounded-3xl bg-emerald-500/8 pointer-events-none" />

            <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur p-7 shadow-2xl shadow-black/60">
              {/* mini resume + scanner */}
              <div className="relative rounded-xl border border-slate-700 bg-slate-950/80 p-4 mb-5 overflow-hidden h-36">
                <div className="space-y-2">
                  <div className="h-3 w-1/2 rounded bg-slate-700" />
                  <div className="h-2 w-3/4 rounded bg-slate-800" />
                  <div className="h-2 w-2/3 rounded bg-slate-800" />
                  <div className="h-px w-full bg-slate-800 my-1.5" />
                  <div className="h-2 w-full rounded bg-slate-800" />
                  <div className="h-2 w-5/6 rounded bg-slate-800" />
                </div>
                <div
                  className="scan-beam"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(52,211,153,.85),transparent)", boxShadow: "0 0 10px 3px rgba(52,211,153,.3)" }}
                />
              </div>

              {/* score */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#1e293b" strokeWidth="7" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#10b981" strokeWidth="7"
                      strokeDasharray={`${.82*138} ${.18*138}`} strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 4px #10b98180)" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-400">82</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ATS Score</p>
                  <p className="text-base font-bold text-emerald-400">Good Match</p>
                  <p className="text-xs text-slate-500">+18 pts available via AI</p>
                </div>
              </div>

              {/* mini section bars */}
              {[
                { label: "Contact Info", val: 100, c: "#10b981" },
                { label: "Keywords",     val: 72,  c: "#10b981" },
                { label: "Experience",   val: 90,  c: "#10b981" },
                { label: "Skills",       val: 60,  c: "#f59e0b" },
                { label: "Summary",      val: 40,  c: "#ef4444" },
              ].map(({ label, val, c }) => (
                <div key={label} className="mb-1.5">
                  <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                    <span>{label}</span><span>{val}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800">
                    <div className="h-1 rounded-full transition-all" style={{ width: `${val}%`, background: c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ──────────────────────────────── */}
      <div className="relative z-10 border-y border-slate-800 bg-slate-900/40 py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Resumes Analyzed",  val: 50000, sfx: "+" },
            { label: "Avg. Score Boost",  val: 40,    sfx: "%" },
            { label: "Keywords Detected", val: 200,   sfx: "+" },
            { label: "User Satisfaction", val: 98,    sfx: "%" },
          ].map(({ label, val, sfx }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-slate-50"><Counter to={val} suffix={sfx} /></p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WHY ATS ─────────────────────────────────── */}
      <section id="why-ats" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">The Problem</p>
          <h2 className="text-4xl font-extrabold text-slate-50">Most resumes never reach a human</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg">
            Applicant Tracking Systems automatically reject resumes before any recruiter sees them — based
            purely on keyword matching and formatting rules.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { stat: "75%", label: "of resumes are rejected by ATS", desc: "3 out of 4 applications never reach a recruiter — even when the candidate is perfectly qualified for the role.", c: "text-red-400", bg: "border-red-500/20 bg-red-500/5" },
            { stat: "98%", label: "of Fortune 500 companies use ATS", desc: "Every major employer uses automated screening. An un-optimized resume disappears before anyone sees it.", c: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/5" },
            { stat: "2×",  label: "more interviews with optimization", desc: "Candidates who tailor their resume to ATS standards consistently double their callback rate.", c: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/5" },
          ].map(({ stat, label, desc, c, bg }) => (
            <div key={stat} className={`rounded-2xl border p-7 ${bg} hover:shadow-lg transition-shadow`}>
              <p className={`text-5xl font-extrabold ${c} mb-2`}>{stat}</p>
              <p className="text-sm font-bold text-slate-200 mb-3">{label}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 bg-slate-900/40 border-y border-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Process</p>
            <h2 className="text-4xl font-extrabold text-slate-50">From upload to ATS-ready in 3 steps</h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">Your entire resume optimization in under a minute.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StepCard n="01" icon="📋" title="Paste the Job Description"    desc="Copy the job posting you're targeting. AI extracts the key skills and keywords the employer is looking for." />
            <StepCard n="02" icon="📄" title="Upload Your Resume PDF"       desc="Drop in your PDF. We parse every section — contact, experience, skills, education — and cross-reference it with the job." />
            <StepCard n="03" icon="🚀" title="Get Your Score & Enhance"     desc="See your full ATS report, then let AI rewrite your resume into a professional, editable template." />
          </div>
          <div className="mt-12 text-center">
            <Link href="/upload" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all">
              Start Checking →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Features</p>
          <h2 className="text-4xl font-extrabold text-slate-50">Everything you need to get hired</h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">A complete toolkit to understand, improve, and land your resume past every ATS filter.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard delay={0}   icon="🎯" title="Instant ATS Score"            desc="0–100 score showing how well your resume matches the job, with color-coded grade labels." />
          <FeatureCard delay={80}  icon="🔍" title="Keyword Gap Analysis"         desc="Every keyword from the job listing — matched ones shown in green, missing ones flagged in amber." />
          <FeatureCard delay={160} icon="📊" title="Section-by-Section Breakdown" desc="Individual grades for Contact, Summary, Experience, Skills, Education — with specific tips per section." />
          <FeatureCard delay={240} icon="✨" title="AI Resume Enhancement"         desc="GPT-4 rewrites your resume to be more impactful and ATS-optimized, tailored to the specific job." />
          <FeatureCard delay={320} icon="✏️" title="Editable Resume Template"     desc="A beautiful professional template with your enhanced content — edit every field before downloading." />
          <FeatureCard delay={400} icon="📁" title="Resume History"               desc="All analyses stored under your email. Track improvement over time and revisit any previous result." />
        </div>
      </section>

      {/* ─── WHAT YOU GET ────────────────────────────── */}
      <section className="relative z-10 bg-slate-900/40 border-y border-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Results</p>
            <h2 className="text-4xl font-extrabold text-slate-50 mb-5">A detailed report, not just a number</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Unlike simple keyword checkers, we give you a complete picture of your resume's ATS performance
              — and tell you exactly what to fix and how.
            </p>
            <ul className="space-y-4">
              {[
                ["📌", "Contact completeness — every missing field is individually flagged"],
                ["🎯", "Matched vs. missing keywords listed side by side"],
                ["💪", "Strengths identified — so you know what to preserve"],
                ["⚠️", "Issues explained in plain English, zero jargon"],
                ["🤖", "AI-generated resume tailored to the specific job description"],
                ["🖊️", "Fully editable template — tweak until it's perfect"],
              ].map(([icon, text]) => (
                <li key={String(text)} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="flex-shrink-0 text-base">{icon}</span>{text}
                </li>
              ))}
            </ul>
          </div>

          {/* mock report preview */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-200">Your ATS Report</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 font-semibold">82 / 100</span>
            </div>
            {[
              { section: "Contact Information", score: 100, c: "text-emerald-400", b: "bg-emerald-500", s: "✓" },
              { section: "Professional Summary", score: 40,  c: "text-red-400",    b: "bg-red-500",    s: "✗" },
              { section: "Work Experience",      score: 90,  c: "text-emerald-400", b: "bg-emerald-500", s: "✓" },
              { section: "Education",            score: 85,  c: "text-emerald-400", b: "bg-emerald-500", s: "✓" },
              { section: "Skills",               score: 60,  c: "text-amber-400",  b: "bg-amber-500",   s: "⚠" },
              { section: "Keywords",             score: 72,  c: "text-emerald-400", b: "bg-emerald-500", s: "✓" },
            ].map(({ section, score, c, b, s }) => (
              <div key={section} className="rounded-xl bg-slate-950/60 border border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-slate-300">{section}</span>
                  <span className={`text-xs font-bold ${c}`}>{s} {score}%</span>
                </div>
                <div className="h-1 rounded-full bg-slate-800">
                  <div className={`h-1 rounded-full ${b}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
            <p className="pt-2 border-t border-slate-800 text-xs text-slate-500 text-center">
              3 improvements recommended · Enhance with AI to fix them all
            </p>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">Free · Instant · No signup</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-50 mb-5">Ready to beat the ATS?</h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Thousands of job seekers have improved their interview rate by optimizing with our
            AI-powered checker. You're next.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-400 transition-all duration-200"
          >
            Check My Resume Now →
          </Link>
          <p className="mt-6 text-xs text-slate-600">PDF upload · No email required · Results in under 30 seconds</p>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs">A</div>
            <span>ATSChecker · AI-Powered Resume Optimization</span>
          </div>
          <div className="flex gap-5">
            <Link href="/upload"    className="hover:text-slate-400 transition-colors">Check Resume</Link>
            <Link href="/dashboard" className="hover:text-slate-400 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
