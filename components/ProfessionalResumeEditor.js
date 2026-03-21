"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { FaGithub, FaExternalLinkAlt, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin, FaGlobe } from "react-icons/fa";
import AISuggestPanel from "./AISuggestPanel";
import HighlightedText from "./HighlightedText";
import GrammarSidebarPanel from "./GrammarSidebarPanel";

/* ══════════════════════════════════════════════════════════════
   A4 DIMENSIONS
   794 × 1123 px  at 96 dpi  (210 × 297 mm)
══════════════════════════════════════════════════════════════ */
const A4_W = 794;   // px
const A4_H = 1123;  // px  — content will overflow to "page 2" naturally

/* ══════════════════════════════════════════════════════════════
   PRINT / PDF  — opens new window, triggers print dialog
══════════════════════════════════════════════════════════════ */
function downloadAsPrint(sheetId, fileName) {
  const el = document.getElementById(sheetId);
  if (!el) { alert("Resume element not found."); return; }

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Please allow popups to download your resume as PDF."); return; }

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${fileName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif; }
    @page { margin:0; size:A4 portrait; }
    #${sheetId} { width:100% !important; min-width:0 !important; box-shadow:none !important; position:static !important; }
    [data-page-break] { display:none !important; }
  </style>
</head>
<body>${el.outerHTML}<script>
  window.onload=function(){
    setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); },800); },350);
  };
<\/script></body>
</html>`);
  win.document.close();
}

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS  (professional dark teal palette)
══════════════════════════════════════════════════════════════ */
const C = {
  accent:      "#0f766e",  /* teal-700 */
  accentDark:  "#134e4a",  /* teal-900 */
  accentLight: "#f0fdfa",  /* teal-50  */
  accentMid:   "#99f6e4",  /* teal-200 */
  headerBg:    "#0f172a",  /* slate-900 – header strip */
  sidebar:     "#f8fafc",  /* slate-50  */
  border:      "#e2e8f0",  /* slate-200 */
  text:        "#0f172a",  /* slate-900 */
  textSub:     "#334155",  /* slate-700 */
  textMuted:   "#64748b",  /* slate-500 */
};

/* font scale tuned for A4 print */
const FS = {
  name:        22,
  title:       12,
  contactItem: 10,
  secHead:      8.5,
  body:        10.5,
  bodySmall:   9.5,
  tag:          9,
};

/* ══════════════════════════════════════════════════════════════
   SECTION HEADING — uppercase coloured divider
══════════════════════════════════════════════════════════════ */
function SecHead({ children, onAdd, addLabel }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      borderBottom:`2px solid ${C.accent}`, paddingBottom:3, marginBottom:8,
    }}>
      <span style={{
        fontSize:FS.secHead, fontWeight:800, textTransform:"uppercase",
        letterSpacing:"0.15em", color:C.accent,
      }}>{children}</span>
      {onAdd && (
        <button onClick={onAdd} style={{
          fontSize:8, fontWeight:700, color:C.accent, background:C.accentLight,
          border:`1px solid ${C.accentMid}`, borderRadius:3, padding:"1px 6px",
          cursor:"pointer",
        }}>+ {addLabel}</button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SKILL / LANGUAGE TAG
══════════════════════════════════════════════════════════════ */
function Tag({ label, color = C.accent, bg = C.accentLight, border = C.accentMid }) {
  return (
    <span style={{
      display:"inline-block", fontSize:FS.tag, fontWeight:500,
      color, background:bg, border:`1px solid ${border}`,
      borderRadius:3, padding:"2px 7px", margin:"1.5px 2px 1.5px 0",
    }}>{label}</span>
  );
}

/* ══════════════════════════════════════════════════════════════
   INLINE-EDIT INPUT
══════════════════════════════════════════════════════════════ */
const inputBase = {
  background:"#eff6ff", border:"1.5px solid #93c5fd", borderRadius:4,
  padding:"2px 6px", width:"100%", outline:"none",
  fontFamily:"inherit", color:"inherit",
};
function EditText({ value, onChange, placeholder, fontSize = FS.body }) {
  return (
    <input type="text" value={value||""} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputBase, fontSize }} />
  );
}
function EditArea({ value, onChange, placeholder, rows = 4, fontSize = FS.body }) {
  return (
    <textarea value={value||""} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{ ...inputBase, fontSize, resize:"vertical", lineHeight:1.55, display:"block" }} />
  );
}

/* ══════════════════════════════════════════════════════════════
   TOOLBAR BUTTON
══════════════════════════════════════════════════════════════ */
function Btn({ onClick, disabled, variant="default", children }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:600,
    cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.55:1,
    border:"none", transition:"all 0.15s",
  };
  const v = {
    default: { background:"#1e293b", color:"#e2e8f0", border:"1px solid #334155" },
    primary: { background:C.accent,  color:"#fff", boxShadow:`0 4px 14px ${C.accent}40` },
    danger:  { background:"#1e293b", color:"#fca5a5", border:"1px solid #334155" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

/* ══════════════════════════════════════════════════════════════
   BULLET RENDERER — "• text" or "- text" → ▸ text
══════════════════════════════════════════════════════════════ */
function Bullets({ text }) {
  if (!text) return null;
  const lines = text.split("\n").filter(l => l.trim());
  return (
    <div style={{ marginTop:4 }}>
      {lines.map((line, i) => {
        const isBullet = /^[•\-*▸]/.test(line.trim());
        const txt = line.replace(/^[•\-*▸]\s*/, "");
        return (
          <div key={i} style={{ display:"flex", gap:5, alignItems:"flex-start", marginBottom:2 }}>
            {isBullet
              ? <><span style={{ color:C.accent, flexShrink:0, fontSize:8, marginTop:2 }}>▸</span>
                  <span style={{ fontSize:FS.body, color:C.textSub, lineHeight:1.55 }}>{txt}</span></>
              : <span style={{ fontSize:FS.body, color:C.textSub, lineHeight:1.55 }}>{line}</span>
            }
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProfessionalResumeEditor({
  initialData,
  onSave,
  resumeId,
  isEnhanced   = false,
  originalScore = null,
  enhancedScore = null,
}) {
  const [data,      setData]     = useState(initialData || {});
  const [editing,   setEditing]  = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [saved,     setSaved]    = useState(false);
  const [printing,  setPrinting] = useState(false);
  const [aiAssist,  setAiAssist] = useState(false);
  const [grammarResult,  setGrammarResult]  = useState(null);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarError,   setGrammarError]   = useState(null);
  const [pageBreaks, setPageBreaks] = useState([]);
  const sheetRef = useRef(null);
  const sheetId  = "resume-a4-sheet";

  /* Track real sheet height → compute page-break positions */
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      const count = Math.floor(h / A4_H);
      setPageBreaks(count > 0 ? Array.from({ length: count }, (_, i) => A4_H * (i + 1)) : []);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const set    = useCallback((f,v)      => setData(d=>({ ...d,[f]:v })),[]);
  const setArr = useCallback((f,i,sf,v) => setData(d=>({
    ...d,[f]:(d[f]||[]).map((item,idx)=>idx===i?(sf?{...item,[sf]:v}:v):item),
  })),[]);
  const addArr = useCallback((f,def)    => setData(d=>({ ...d,[f]:[...(d[f]||[]),def] })),[]);
  const delArr = useCallback((f,i)      => setData(d=>({ ...d,[f]:(d[f]||[]).filter((_,idx)=>idx!==i) })),[]);

  const handleSave    = async() => {
    setSaving(true);
    try { await onSave?.(data); setEditing(false); setSaved(true); setTimeout(()=>setSaved(false),2500); }
    finally { setSaving(false); }
  };
  const handleDiscard = ()=>{ setEditing(false); setData(initialData||{}); };

  const handleAnalyze = async () => {
    setGrammarLoading(true);
    setGrammarError(null);
    try {
      const res = await fetch("/api/grammar-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: {
            summary: data.summary || "",
            experience: (data.experience || []).map((e, i) => ({ ...e, _index: i })),
            projects:   (data.projects   || []).map((p, i) => ({ ...p, _index: i })),
            education:  (data.education  || []).map((e, i) => ({ ...e, _index: i })),
            skills:     data.skills || [],
            certifications: (data.certifications || []).map((c, i) => ({
              ...(typeof c === "string" ? { name: c } : c), _index: i,
            })),
          },
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setGrammarResult(json);
    } catch (e) {
      setGrammarError(e.message);
    } finally {
      setGrammarLoading(false);
    }
  };

  const handleGrammarCorrect = useCallback((issue) => {
    const { section, entryIndex, field, original, correction } = issue;
    setData(d => {
      if (entryIndex === null || entryIndex === undefined) {
        const cur = d[section] || "";
        return { ...d, [section]: cur.replace(original, correction) };
      }
      const arr = d[section] || [];
      return {
        ...d,
        [section]: arr.map((item, idx) => {
          if (idx !== entryIndex) return item;
          if (typeof item === "string") return item.replace(original, correction);
          const val = item[field] || "";
          return { ...item, [field]: val.replace(original, correction) };
        }),
      };
    });
    setGrammarResult(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: {
          ...prev.sections[section],
          issues: prev.sections[section].issues.filter(
            iss => !(iss.original === original && iss.entryIndex === entryIndex && iss.field === field)
          ),
        },
      },
    }));
  }, []);

  const issuesFor = useCallback((section, field, entryIndex = null) =>
    grammarResult?.sections?.[section]?.issues?.filter(
      iss => iss.field === field && iss.entryIndex === entryIndex
    ) ?? []
  , [grammarResult]);

  const handlePrint   = ()=>{
    setPrinting(true);
    try { downloadAsPrint(sheetId,`${data.name||"Resume"}_${isEnhanced?"Enhanced_":""}ATS.pdf`); }
    finally { setTimeout(()=>setPrinting(false),1200); }
  };

  const initials = (n="")=>{
    const p=n.trim().split(/\s+/);
    return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(p[0]?.[0]||"?").toUpperCase();
  };

  /* ──────────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* ════ TOOLBAR ════ */}
      <div style={{
        display:"flex", flexWrap:"wrap", alignItems:"center",
        justifyContent:"space-between", gap:12, marginBottom:16,
      }}>
        <div>
          {isEnhanced && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6, fontSize:11,
              fontWeight:700, color:"#34d399", background:"#064e3b40",
              border:"1px solid #065f4640", borderRadius:99, padding:"3px 12px", marginBottom:6,
            }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#34d399",animation:"pulse 1.5s infinite" }}/>
              AI-Enhanced · ATS-Optimized
            </div>
          )}
          <div style={{ fontSize:17, fontWeight:800, color:"#f1f5f9" }}>
            {editing?"Editing Resume":isEnhanced?"AI-Optimized Resume":"Resume Template"}
          </div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>
            {editing?"Click any field to edit — blue = active input":"A4 format · Edit inline or download as PDF"}
          </div>
          {originalScore!==null&&enhancedScore!==null&&(
            <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:5 }}>
              <span style={{ fontSize:12,color:"#94a3b8" }}>Original: <b style={{ color:"#f87171" }}>{originalScore}</b></span>
              <span style={{ color:"#475569" }}>→</span>
              <span style={{ fontSize:12,color:"#94a3b8" }}>Enhanced: <b style={{ color:"#34d399" }}>{enhancedScore}</b></span>
              {enhancedScore>originalScore&&(
                <span style={{ fontSize:11,fontWeight:700,color:"#34d399",background:"#064e3b40",border:"1px solid #065f4640",borderRadius:99,padding:"1px 9px" }}>
                  +{enhancedScore-originalScore} pts
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {editing?(
            <>
              <button
                onClick={() => setAiAssist(v => !v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: "none", transition: "all 0.15s",
                  background: aiAssist ? "#6d28d9" : "#1e293b",
                  color: aiAssist ? "#fff" : "#a78bfa",
                  boxShadow: aiAssist ? "0 4px 14px #6d28d940" : "none",
                  outline: aiAssist ? "1px solid #7c3aed" : "1px solid #334155",
                }}
              >
                ✨ AI Assist {aiAssist ? "On" : "Off"}
              </button>
              <Btn onClick={handleDiscard} variant="danger">✕ Discard</Btn>
              <Btn onClick={handleSave} disabled={saving} variant="primary">
                {saving?"⏳ Saving…":"✓ Save Changes"}
              </Btn>
            </>
          ):(
            <>
              {saved&&<span style={{ fontSize:12,color:"#34d399",alignSelf:"center" }}>✓ Saved</span>}
              <button
                onClick={handleAnalyze}
                disabled={grammarLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: grammarLoading ? "not-allowed" : "pointer",
                  border: "none", transition: "all 0.15s", opacity: grammarLoading ? 0.7 : 1,
                  background: grammarResult ? "#1e1b4b" : "#1e293b",
                  color: grammarResult ? "#a5b4fc" : "#94a3b8",
                  outline: grammarResult ? "1px solid #4338ca" : "1px solid #334155",
                }}
              >
                {grammarLoading ? (
                  <>
                    <span style={{ width:12,height:12,borderRadius:"50%",border:"2px solid #a5b4fc",borderTopColor:"transparent",animation:"spin .7s linear infinite",display:"inline-block" }}/>
                    Analyzing…
                  </>
                ) : grammarResult ? "🔍 Re-Analyze" : "🔍 Analyze Resume"}
              </button>
              {grammarError && <span style={{ fontSize:10,color:"#ef4444" }}>⚠ {grammarError}</span>}
              <Btn onClick={handlePrint} disabled={printing} variant="default">
                {printing?"⏳ Opening…":"⬇ Download PDF"}
              </Btn>
              <Btn onClick={()=>setEditing(true)} variant="primary">✏ Edit Resume</Btn>
            </>
          )}
        </div>
      </div>

      {/* ════ A4 PAPER TRAY ════
          Transparent — A4 sheet floats directly on the page background.
      */}
      <div style={{
        background:"transparent",
        padding:"24px 0 40px",
        overflowX:"auto",
      }}>
        {/* A4 white sheet */}
        <div
          id={sheetId}
          ref={sheetRef}
          style={{
            width:A4_W,
            minHeight:A4_H,
            margin:"0 auto",
            background:"#fff",
            color:C.text,
            fontFamily:"'Segoe UI','Helvetica Neue',Arial,sans-serif",
            fontSize:FS.body,
            lineHeight:1.5,
            boxShadow:"0 4px 60px rgba(0,0,0,0.70), 0 1px 0 rgba(255,255,255,0.04)",
            position:"relative",
          }}
        >
          {/* ── PAGE BREAK MARKERS (screen-only, hidden on print) ── */}
          {pageBreaks.map((y, i) => (
            <div key={i} data-page-break="true" style={{
              position:"absolute", top:y, left:0, right:0, zIndex:20, pointerEvents:"none",
            }}>
              <div style={{ height:2, background:"linear-gradient(to bottom,rgba(0,0,0,0.18),transparent)" }}/>
              <div style={{ borderTop:"2px dashed #94a3b8", opacity:0.5 }}/>
              <div style={{ position:"absolute", right:10, top:-10, fontSize:8, color:"#94a3b8",
                background:"#fff", padding:"0 6px", borderRadius:3, fontFamily:"sans-serif" }}>
                Page {i + 2}
              </div>
            </div>
          ))}

          {/* ── HEADER STRIP ─────────────────────────────────── */}
          <div style={{
            background:`linear-gradient(135deg,${C.accentDark} 0%,${C.accent} 100%)`,
            color:"#fff",
            padding:"26px 30px 20px",
            position:"relative",
            overflow:"hidden",
          }}>
            {/* decorative circles */}
            <div style={{ position:"absolute",right:-30,top:-30,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.06)" }}/>
            <div style={{ position:"absolute",right:80,bottom:-50,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.04)" }}/>

            <div style={{ display:"flex",alignItems:"flex-start",gap:16,position:"relative" }}>

              {/* Avatar initials */}
              {!editing&&(
                <div style={{
                  flexShrink:0,width:54,height:54,borderRadius:"50%",
                  background:"rgba(255,255,255,0.18)",border:"2px solid rgba(255,255,255,0.45)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,fontWeight:800,color:"#fff",
                  boxShadow:"0 3px 10px rgba(0,0,0,0.25)",
                }}>{initials(data.name)}</div>
              )}

              <div style={{ flex:1,minWidth:0 }}>
                {/* Name */}
                {editing?(
                  <input value={data.name||""} onChange={e=>set("name",e.target.value)}
                    placeholder="Full Name"
                    style={{ fontSize:22,fontWeight:800,background:"rgba(255,255,255,0.15)",
                      border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:5,
                      padding:"3px 10px",color:"#fff",width:"100%",outline:"none" }}/>
                ):(
                  <div style={{ fontSize:FS.name,fontWeight:800,letterSpacing:"-0.3px",lineHeight:1.1 }}>
                    {data.name||<span style={{ opacity:0.4 }}>Your Name</span>}
                  </div>
                )}

                {/* Headline */}
                {editing?(
                  <input value={data.headline||data.experience?.[0]?.title||""}
                    onChange={e=>set("headline",e.target.value)}
                    placeholder="Professional Title (e.g. Senior Software Engineer)"
                    style={{ fontSize:FS.title,background:"rgba(255,255,255,0.12)",
                      border:"1px solid rgba(255,255,255,0.3)",borderRadius:4,
                      padding:"2px 8px",color:"rgba(255,255,255,0.92)",
                      width:"100%",outline:"none",marginTop:5,fontFamily:"inherit" }}/>
                ):(
                  <div style={{ fontSize:FS.title,opacity:0.88,marginTop:4,fontWeight:400 }}>
                    {data.headline||data.experience?.[0]?.title||""}
                  </div>
                )}

                {/* Contact bar */}
                {editing?(
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:10 }}>
                    {[
                      {k:"email",ph:"Email"},
                      {k:"phone",ph:"Phone"},
                      {k:"address",ph:"City, Country"},
                    ].map(({k,ph})=>(
                      <input key={k} value={data[k]||""} onChange={e=>set(k,e.target.value)}
                        placeholder={ph}
                        style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                          borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                          outline:"none",fontFamily:"inherit" }}/>
                    ))}
                    {/* LinkedIn URL + display text */}
                    <input value={data.linkedin||""} onChange={e=>set("linkedin",e.target.value)}
                      placeholder="LinkedIn URL (https://linkedin.com/in/…)"
                      style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                        outline:"none",fontFamily:"inherit" }}/>
                    <input value={data.linkedinText||""} onChange={e=>set("linkedinText",e.target.value)}
                      placeholder="LinkedIn display text (e.g. john-doe)"
                      style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                        outline:"none",fontFamily:"inherit" }}/>
                    {/* GitHub URL + display text */}
                    <input value={data.github||""} onChange={e=>set("github",e.target.value)}
                      placeholder="GitHub URL (https://github.com/…)"
                      style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                        outline:"none",fontFamily:"inherit" }}/>
                    <input value={data.githubText||""} onChange={e=>set("githubText",e.target.value)}
                      placeholder="GitHub display text (e.g. johndoe)"
                      style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                        outline:"none",fontFamily:"inherit" }}/>
                    {/* Portfolio URL + display text */}
                    <input value={data.portfolio||""} onChange={e=>set("portfolio",e.target.value)}
                      placeholder="Portfolio URL"
                      style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                        outline:"none",fontFamily:"inherit" }}/>
                    <input value={data.portfolioText||""} onChange={e=>set("portfolioText",e.target.value)}
                      placeholder="Portfolio display text"
                      style={{ background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:4,padding:"2px 7px",color:"#fff",fontSize:9.5,
                        outline:"none",fontFamily:"inherit" }}/>
                  </div>
                ):(
                  <div style={{ display:"flex",flexWrap:"wrap",gap:"4px 18px",marginTop:9,fontSize:FS.contactItem,opacity:0.9 }}>
                    {data.email    && <span style={{ display:"inline-flex",alignItems:"center",gap:4 }}><FaEnvelope size={10}/> {data.email}</span>}
                    {data.phone    && <span style={{ display:"inline-flex",alignItems:"center",gap:4 }}><FaPhone size={10}/> {data.phone}</span>}
                    {data.address  && <span style={{ display:"inline-flex",alignItems:"center",gap:4 }}><FaMapMarkerAlt size={10}/> {data.address}</span>}
                    {data.linkedin && (
                      <a href={data.linkedin.startsWith("http")?data.linkedin:`https://${data.linkedin}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color:"inherit",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>
                        <FaLinkedin size={11} color="#61b0ff"/> {data.linkedinText || data.linkedin.replace(/https?:\/\/(www\.)?/i,"")}
                      </a>
                    )}
                    {data.github   && (
                      <a href={data.github.startsWith("http")?data.github:`https://${data.github}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color:"inherit",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>
                        <FaGithub size={11}/> {data.githubText || data.github.replace(/https?:\/\/(www\.)?/i,"")}
                      </a>
                    )}
                    {data.portfolio && (
                      <a href={data.portfolio.startsWith("http")?data.portfolio:`https://${data.portfolio}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color:"inherit",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>
                        <FaGlobe size={10}/> {data.portfolioText || data.portfolio.replace(/https?:\/\/(www\.)?/i,"")}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── BODY: sidebar + main ────────────────────────── */}
          <div style={{ display:"grid",gridTemplateColumns:"200px 1fr" }}>

            {/* ─── LEFT SIDEBAR ─── */}
            <div style={{
              background:C.sidebar,
              borderRight:`1px solid ${C.border}`,
              padding:"18px 14px",
              display:"flex",flexDirection:"column",gap:18,
            }}>

              {/* SKILLS */}
              <section>
                <SecHead onAdd={editing?()=>addArr("skills",""):null} addLabel="Skill">Skills</SecHead>
                {editing?(
                  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                    {(data.skills||[]).map((sk,i)=>(
                      <div key={i} style={{ display:"flex",gap:4,alignItems:"center" }}>
                        <input value={sk} onChange={e=>setArr("skills",i,null,e.target.value)}
                          style={{ flex:1,fontSize:10,background:"#eff6ff",border:"1px solid #93c5fd",borderRadius:3,padding:"2px 5px",outline:"none",fontFamily:"inherit" }}/>
                        <button onClick={()=>delArr("skills",i)} style={{ color:"#f87171",background:"none",border:"none",cursor:"pointer",fontSize:12 }}>✕</button>
                      </div>
                    ))}
                    {!(data.skills||[]).length&&<span style={{ fontSize:10,color:"#aaa" }}>No skills yet</span>}
                    {aiAssist && (
                      <AISuggestPanel
                        section="skills"
                        context={{ role: (data.experience||[])[0]?.title, currentSkills: (data.skills||[]).join(", ") }}
                        onApply={s => addArr("skills", s)}
                        label="Suggest Skills"
                      />
                    )}
                  </div>
                ):(
                  <div style={{ display:"flex",flexWrap:"wrap",gap:3 }}>
                    {(data.skills||[]).map((sk,i)=><Tag key={i} label={sk}/>)}
                    {!(data.skills||[]).length&&<p style={{ fontSize:10,color:C.textMuted }}>No skills added</p>}
                  </div>
                )}
              </section>

              {/* EDUCATION */}
              <section>
                <SecHead onAdd={editing?()=>addArr("education",{degree:"",institution:"",year:""}):null} addLabel="Edu">
                  Education
                </SecHead>
                {(data.education||[]).map((edu,i)=>(
                  <div key={i} style={{ marginBottom:10,paddingBottom:8,borderBottom:i<(data.education.length-1)?`1px solid ${C.border}`:"none" }}>
                    {editing?(
                      <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                        <EditText value={edu.degree} onChange={v=>setArr("education",i,"degree",v)} placeholder="Degree" fontSize={10}/>
                        <EditText value={edu.institution} onChange={v=>setArr("education",i,"institution",v)} placeholder="Institution" fontSize={10}/>
                        <EditText value={edu.year} onChange={v=>setArr("education",i,"year",v)} placeholder="Year" fontSize={10}/>
                        <button onClick={()=>delArr("education",i)} style={{ alignSelf:"flex-end",color:"#f87171",fontSize:9,background:"none",border:"none",cursor:"pointer" }}>Remove</button>
                      </div>
                    ):(
                      <>
                        <div style={{ fontSize:10.5,fontWeight:700,color:C.text,lineHeight:1.3 }}>{edu.degree}</div>
                        <div style={{ fontSize:FS.bodySmall,color:C.textSub,marginTop:1 }}>{edu.institution}</div>
                        <div style={{ fontSize:9,color:C.textMuted,marginTop:1 }}>{edu.year}{edu.gpa?` · GPA ${edu.gpa}`:""}</div>
                      </>
                    )}
                  </div>
                ))}
                {!(data.education||[]).length&&!editing&&<p style={{ fontSize:10,color:C.textMuted }}>No education added</p>}
              </section>

              {/* CERTIFICATIONS */}
              {(editing||(data.certifications||[]).length>0)&&(
                <section>
                  <SecHead onAdd={editing?()=>addArr("certifications",{name:"",issuer:"",year:""}):null} addLabel="Cert">
                    Certifications
                  </SecHead>
                  {(data.certifications||[]).map((cert,i)=>{
                    const certObj = typeof cert==="string" ? {name:cert,issuer:"",year:""} : cert;
                    return (
                    <div key={i} style={{ marginBottom:8 }}>
                      {editing?(
                        <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                          <EditText value={certObj.name||""} onChange={v=>setArr("certifications",i,"name",v)} placeholder="Certification" fontSize={10}/>
                          <EditText value={certObj.issuer||""} onChange={v=>setArr("certifications",i,"issuer",v)} placeholder="Issuer" fontSize={10}/>
                          <EditText value={certObj.year||""} onChange={v=>setArr("certifications",i,"year",v)} placeholder="Year" fontSize={10}/>
                          <button onClick={()=>delArr("certifications",i)} style={{ alignSelf:"flex-end",color:"#f87171",fontSize:9,background:"none",border:"none",cursor:"pointer" }}>Remove</button>
                        </div>
                      ):(
                        <>
                          <div style={{ fontSize:10,fontWeight:600,color:C.text,lineHeight:1.3 }}>{certObj.name}</div>
                          {(certObj.issuer||certObj.year)&&<div style={{ fontSize:9,color:C.textSub,marginTop:1 }}>{certObj.issuer}{certObj.year?` · ${certObj.year}`:""}</div>}
                        </>
                      )}
                    </div>
                    );
                  })}
                </section>
              )}

              {/* LANGUAGES */}
              {(editing||(data.languages||[]).length>0)&&(
                <section>
                  <SecHead onAdd={editing?()=>addArr("languages",""):null} addLabel="Lang">Languages</SecHead>
                  {editing?(
                    <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                      {(data.languages||[]).map((l,i)=>(
                        <div key={i} style={{ display:"flex",gap:4,alignItems:"center" }}>
                          <input value={l} onChange={e=>setArr("languages",i,null,e.target.value)}
                            style={{ flex:1,fontSize:10,background:"#eff6ff",border:"1px solid #93c5fd",borderRadius:3,padding:"2px 5px",outline:"none",fontFamily:"inherit" }}/>
                          <button onClick={()=>delArr("languages",i)} style={{ color:"#f87171",background:"none",border:"none",cursor:"pointer",fontSize:12 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ):(
                    <div style={{ display:"flex",flexWrap:"wrap",gap:3 }}>
                      {(data.languages||[]).map((l,i)=>(
                        <Tag key={i} label={l} color="#166534" bg="#f0fdf4" border="#bbf7d0"/>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* ─── MAIN CONTENT ─── */}
            <div style={{ padding:"18px 22px",display:"flex",flexDirection:"column",gap:18 }}>

              {/* PROFESSIONAL SUMMARY */}
              {(editing||data.summary)&&(
                <section>
                  <SecHead>Professional Summary</SecHead>
                  {editing?(
                    <>
                      {aiAssist && (
                        <AISuggestPanel
                          section="summary"
                          context={{ name: data.name, role: (data.experience||[])[0]?.title, skills: (data.skills||[]).join(", ") }}
                          onApply={s => set("summary", s)}
                          label="Suggest Summary"
                        />
                      )}
                      <EditArea value={data.summary} onChange={v=>set("summary",v)} rows={4}
                        placeholder="Write a compelling 40–80 word summary. Include your title, years of experience, key skills, and what makes you ideal for this role…"/>
                    </>
                  ):(
                    <p style={{ fontSize:FS.body,color:C.textSub,lineHeight:1.7,margin:0 }}>
                      <HighlightedText text={data.summary} issues={issuesFor("summary","summary")} onCorrect={handleGrammarCorrect}/>
                    </p>
                  )}
                </section>
              )}

              {/* WORK EXPERIENCE */}
              {(editing||(data.experience||[]).length>0)&&(
                <section>
                  <SecHead
                    onAdd={editing?()=>addArr("experience",{title:"",company:"",duration:"",description:""}):null}
                    addLabel="Role">
                    Work Experience
                  </SecHead>
                  {(data.experience||[]).map((exp,i)=>(
                    <div key={i} style={{
                      paddingLeft:10,borderLeft:`2.5px solid ${C.accent}`,
                      marginBottom:14,
                    }}>
                      {editing?(
                        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 140px",gap:5 }}>
                            <EditText value={exp.title} onChange={v=>setArr("experience",i,"title",v)} placeholder="Job Title" fontSize={11}/>
                            <EditText value={exp.duration} onChange={v=>setArr("experience",i,"duration",v)} placeholder="Jan 2022–Present" fontSize={9.5}/>
                          </div>
                          <EditText value={exp.company} onChange={v=>setArr("experience",i,"company",v)} placeholder="Company Name" fontSize={10}/>
                          {aiAssist && (
                            <AISuggestPanel
                              section="experience_bullets"
                              context={{ role: exp.title, company: exp.company, skills: (data.skills||[]).join(", ") }}
                              onApply={s => setArr("experience", i, "description", (exp.description ? exp.description + "\n" : "") + "• " + s)}
                              label="Suggest Bullets"
                            />
                          )}
                          <EditArea value={exp.description} onChange={v=>setArr("experience",i,"description",v)} rows={4}
                            placeholder={"• Led team of 8 engineers…\n• Built REST APIs serving 100k+ DAU\n• Reduced deployment time by 60%"}
                            fontSize={FS.body}/>
                          <button onClick={()=>delArr("experience",i)} style={{ alignSelf:"flex-end",color:"#f87171",fontSize:9,background:"none",border:"none",cursor:"pointer" }}>Remove Role</button>
                        </div>
                      ):(
                        <>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                            <div style={{ fontSize:11.5,fontWeight:700,color:C.text,lineHeight:1.25 }}>{exp.title}</div>
                            <div style={{ fontSize:FS.bodySmall,color:C.textMuted,whiteSpace:"nowrap",flexShrink:0 }}>{exp.duration}</div>
                          </div>
                          <div style={{ fontSize:FS.bodySmall,fontWeight:600,color:C.accent,marginTop:1 }}>{exp.company}</div>
                          <div style={{ marginTop:4 }}>
                            {(exp.description||"").split("\n").filter(l=>l.trim()).map((line,li)=>{
                              const clean=line.replace(/^[•◦\-*▸]\s*/,"");
                              const lineIssues=issuesFor("experience","description",i).filter(iss=>iss.original&&clean.includes(iss.original));
                              return (
                                <div key={li} style={{ display:"flex",gap:6,marginBottom:3 }}>
                                  <span style={{ flexShrink:0,color:C.accent,marginTop:2 }}>▸</span>
                                  <HighlightedText text={clean} issues={lineIssues} onCorrect={handleGrammarCorrect} style={{ fontSize:FS.body,lineHeight:1.6,color:C.textSub }}/>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {!(data.experience||[]).length&&!editing&&(
                    <p style={{ fontSize:10,color:C.textMuted,paddingLeft:10 }}>No experience added</p>
                  )}
                </section>
              )}

              {/* PROJECTS */}
              {(editing||(data.projects||[]).length>0)&&(
                <section>
                  <SecHead
                    onAdd={editing?()=>addArr("projects",{name:"",description:"",technologies:[],githubRepo:"",liveLink:""}):null}
                    addLabel="Project">
                    Projects
                  </SecHead>
                  {(data.projects||[]).map((proj,i)=>(
                    <div key={i} style={{
                      paddingLeft:10,borderLeft:"2.5px solid #6366f1",
                      marginBottom:12,
                    }}>
                      {editing?(
                        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                          <EditText value={proj.name} onChange={v=>setArr("projects",i,"name",v)} placeholder="Project Name" fontSize={11}/>
                          {aiAssist && (
                            <AISuggestPanel
                              section="project_description"
                              context={{ projectName: proj.name, technologies: (proj.technologies||[]).join(", ") }}
                              onApply={s => setArr("projects", i, "description", (proj.description ? proj.description + "\n" : "") + "• " + s)}
                              label="Suggest Bullets"
                            />
                          )}
                          <EditArea value={proj.description} onChange={v=>setArr("projects",i,"description",v)} rows={3}
                            placeholder="Describe the project, your role, outcomes and technologies used…"
                            fontSize={FS.body}/>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:4 }}>
                            <EditText value={proj.githubRepo||""} onChange={v=>setArr("projects",i,"githubRepo",v)} placeholder="GitHub repo URL" fontSize={9.5}/>
                            <EditText value={proj.liveLink||""}   onChange={v=>setArr("projects",i,"liveLink",v)}   placeholder="Live demo URL"    fontSize={9.5}/>
                          </div>
                          <button onClick={()=>delArr("projects",i)} style={{ alignSelf:"flex-end",color:"#f87171",fontSize:9,background:"none",border:"none",cursor:"pointer" }}>Remove</button>
                        </div>
                      ):(
                        <>
                          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                            <div style={{ fontSize:11,fontWeight:700,color:"#312e81",lineHeight:1.25 }}>{proj.name}</div>
                            {proj.githubRepo&&(
                              <a href={proj.githubRepo.startsWith("http")?proj.githubRepo:`https://${proj.githubRepo}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ fontSize:8.5,color:"#4338ca",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3,
                                  background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:3,padding:"1px 6px" }}>
                                <FaGithub size={10}/> GitHub
                              </a>
                            )}
                            {proj.liveLink&&(
                              <a href={proj.liveLink.startsWith("http")?proj.liveLink:`https://${proj.liveLink}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ fontSize:8.5,color:"#0369a1",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3,
                                  background:"#e0f2fe",border:"1px solid #7dd3fc",borderRadius:3,padding:"1px 6px" }}>
                                <FaExternalLinkAlt size={8}/> Live
                              </a>
                            )}
                          </div>
                          <div style={{ fontSize:FS.body,color:C.textSub,marginTop:3,lineHeight:1.6 }}>{proj.description}</div>
                          {(proj.technologies||[]).length>0&&(
                            <div style={{ marginTop:5,display:"flex",flexWrap:"wrap",gap:3 }}>
                              {proj.technologies.map((t,ti)=>(
                                <span key={ti} style={{
                                  background:"#eef2ff",color:"#4338ca",border:"1px solid #c7d2fe",
                                  borderRadius:3,padding:"1px 6px",fontSize:8.5,
                                }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>

          {/* ── PAGE FOOTER ──────────────────────────────────── */}
          {/* <div style={{
            borderTop:`1px solid ${C.border}`,background:C.sidebar,
            padding:"6px 24px",display:"flex",justifyContent:"space-between",
            alignItems:"center",
          }}>
            <span style={{ fontSize:8.5,color:C.textMuted }}>
              {isEnhanced?"✨ AI-Enhanced · ATS-Optimized":"Resume"}
            </span>
            <span style={{ fontSize:8.5,color:C.textMuted }}>
              {data.email||""}
            </span>
          </div> */}
        </div>{/* /A4 sheet */}

        {/* page hint */}
        <div style={{ textAlign:"center",marginTop:16,fontSize:11,color:"#64748b",letterSpacing:"0.03em" }}>
          A4 · 210 × 297 mm
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>

    {grammarResult && !editing && (
      <GrammarSidebarPanel
        result={grammarResult}
        onCorrect={handleGrammarCorrect}
        onDismiss={() => setGrammarResult(null)}
      />
    )}
    </div>
  );
}
