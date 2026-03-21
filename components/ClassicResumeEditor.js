"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { FaGithub, FaLinkedin, FaExternalLinkAlt, FaEnvelope, FaPhone, FaGlobe } from "react-icons/fa";

/* ══════════════════════════════════════════════════════════════
   CLASSIC / ACADEMIC RESUME TEMPLATE
   Matches the clean one-column PDF format (Mohit Bajaj style)
   794 × auto px  (A4 width at 96 dpi)
══════════════════════════════════════════════════════════════ */

const A4_W = 794;
const A4_H = 1123;

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
    html, body { width:100%; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    @page { margin:0; size:A4 portrait; }
    /* Reset the screen-only fixed-width styles so content fills A4 naturally */
    #${sheetId} {
      width:100% !important;
      min-width:0 !important;
      box-shadow:none !important;
      position:static !important;
    }
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

/* ── INLINE INPUT BASE ── */
const inputBase = {
  width: "100%", border: "1px dashed #a5b4fc", borderRadius: 3,
  background: "#eef2ff", outline: "none", fontFamily: "inherit",
  padding: "2px 5px", boxSizing: "border-box",
};

function EditText({ value, onChange, placeholder, fontSize = 11, bold = false, italic = false, align = "left" }) {
  return (
    <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
      style={{ ...inputBase, fontSize, fontWeight: bold ? "700" : "400", fontStyle: italic ? "italic" : "normal", textAlign: align }} />
  );
}

function EditArea({ value, onChange, placeholder, rows = 3, fontSize = 10.5 }) {
  return (
    <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""} rows={rows}
      style={{ ...inputBase, fontSize, resize: "vertical", lineHeight: 1.5, display: "block" }} />
  );
}

/* ── SECTION HEADING with underline rule ── */
function SecHead({ children, onAdd, addLabel }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Times New Roman',Times,serif" }}>{children}</span>
        {onAdd && (
          <button onClick={onAdd} style={{
            fontSize: 8, fontWeight: 700, color: "#4338ca", background: "#eef2ff",
            border: "1px solid #a5b4fc", borderRadius: 3, padding: "1px 6px", cursor: "pointer",
          }}>+ {addLabel}</button>
        )}
      </div>
      <hr style={{ borderTop: "1.5px solid #000", marginTop: 2 }} />
    </div>
  );
}

/* ── TOOLBAR BUTTON ── */
function Btn({ onClick, disabled, variant = "default", children }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, border: "none", transition: "all 0.15s" };
  const v = {
    default: { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155" },
    primary: { background: "#0f766e", color: "#fff", boxShadow: "0 4px 14px #0f766e40" },
    danger: { background: "#1e293b", color: "#fca5a5", border: "1px solid #334155" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...v[variant] }}>{children}</button>;
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ClassicResumeEditor({
  initialData,
  onSave,
  resumeId,
  isEnhanced = false,
  originalScore = null,
  enhancedScore = null,
}) {
  const [data, setData] = useState(initialData || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [pageBreaks, setPageBreaks] = useState([]);
  const sheetRef = useRef(null);
  const sheetId = "classic-resume-a4-sheet";

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

  const set = useCallback((f, v) => setData(d => ({ ...d, [f]: v })), []);
  const setArr = useCallback((f, i, sf, v) => setData(d => ({
    ...d, [f]: (d[f] || []).map((item, idx) => idx === i ? (sf ? { ...item, [sf]: v } : v) : item),
  })), []);
  const addArr = useCallback((f, def) => setData(d => ({ ...d, [f]: [...(d[f] || []), def] })), []);
  const delArr = useCallback((f, i) => setData(d => ({ ...d, [f]: (d[f] || []).filter((_, idx) => idx !== i) })), []);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave?.(data); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    finally { setSaving(false); }
  };
  const handleDiscard = () => { setEditing(false); setData(initialData || {}); };
  const handlePrint = () => {
    setPrinting(true);
    try { downloadAsPrint(sheetId, `${data.name || "Resume"}_${isEnhanced ? "Enhanced_" : ""}Classic.pdf`); }
    finally { setTimeout(() => setPrinting(false), 1200); }
  };

  /* Helper: group skills by category from the flat skills array or use dedicated field */
  const skillGroups = data.skillGroups || [];

  return (
    <div>
      {/* ════ TOOLBAR ════ */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          {isEnhanced && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#34d399", background: "#064e3b40", border: "1px solid #065f4640", borderRadius: 99, padding: "3px 12px", marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "pulse 1.5s infinite" }} />
              AI-Enhanced · ATS-Optimized
            </div>
          )}
          <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9" }}>
            {editing ? "Editing Resume" : isEnhanced ? "AI-Optimized Resume" : "Classic Resume Template"}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {editing ? "Click any field to edit — blue = active input" : "Classic one-column format · Edit inline or download as PDF"}
          </div>
          {originalScore !== null && enhancedScore !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Original: <b style={{ color: "#f87171" }}>{originalScore}</b></span>
              <span style={{ color: "#475569" }}>→</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Enhanced: <b style={{ color: "#34d399" }}>{enhancedScore}</b></span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {editing ? (
            <>
              <Btn variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : saved ? "✓ Saved" : "💾 Save"}
              </Btn>
              <Btn variant="danger" onClick={handleDiscard}>✕ Discard</Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setEditing(true)}>✏️ Edit</Btn>
              <Btn variant="primary" onClick={handlePrint} disabled={printing}>
                {printing ? "Opening…" : "⬇ Download PDF"}
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* ════ A4 SHEET ════ */}
      <div style={{ overflowX: "auto" }}>
        <div
          id={sheetId}
          ref={sheetRef}
          style={{
            width: A4_W,
            minWidth: A4_W,
            margin: "0 auto",
            background: "#fff",
            color: "#000",
            fontFamily: "'Times New Roman',Times,serif",
            fontSize: 10.5,
            lineHeight: 1.5,
            padding: "36px 48px 48px",
            boxShadow: "0 4px 60px rgba(0,0,0,0.70), 0 1px 0 rgba(255,255,255,0.04)",
            position: "relative",
          }}
        >
          {/* ── PAGE BREAK MARKERS (screen-only, hidden on print) ── */}
          {pageBreaks.map((y, i) => (
            <div key={i} data-page-break="true" style={{
              position: "absolute", top: y, left: 0, right: 0, zIndex: 20, pointerEvents: "none",
            }}>
              <div style={{ height: 2, background: "linear-gradient(to bottom,rgba(0,0,0,0.12),transparent)" }} />
              <div style={{ borderTop: "2px dashed #94a3b8", opacity: 0.4 }} />
              <div style={{
                position: "absolute", right: 10, top: -10, fontSize: 8, color: "#94a3b8",
                background: "#fff", padding: "0 6px", borderRadius: 3, fontFamily: "sans-serif"
              }}>
                Page {i + 2}
              </div>
            </div>
          ))}

          {/* ── HEADER ── */}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            {/* Name */}
            {editing ? (
              <EditText value={data.name} onChange={v => set("name", v)} placeholder="Full Name"
                fontSize={24} bold align="center" />
            ) : (
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.04em" }}>{data.name || "Your Name"}</div>
            )}

            {/* Contact row */}
            {editing ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 }}>
                <EditText value={data.email} onChange={v => set("email", v)} placeholder="Email" fontSize={9.5} />
                <EditText value={data.phone} onChange={v => set("phone", v)} placeholder="Phone" fontSize={9.5} />
                <EditText value={data.linkedin} onChange={v => set("linkedin", v)} placeholder="LinkedIn URL" fontSize={9.5} />
                <EditText value={data.linkedinText} onChange={v => set("linkedinText", v)} placeholder="LinkedIn display text" fontSize={9.5} />
                <EditText value={data.github} onChange={v => set("github", v)} placeholder="GitHub URL" fontSize={9.5} />
                <EditText value={data.githubText} onChange={v => set("githubText", v)} placeholder="GitHub display text" fontSize={9.5} />
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 14px", marginTop: 5, fontSize: 10 }}>
                {data.email && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FaEnvelope size={11} color="#555" /> {data.email}
                  </span>
                )}
                {data.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FaPhone size={11} color="#555" /> {data.phone}
                  </span>
                )}
                {data.linkedin && (
                  <a href={data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: "#000", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    <FaLinkedin size={14} color="#0077b5" />
                    {data.linkedinText || data.linkedin.replace(/https?:\/\/(www\.)?/i, "")}
                  </a>
                )}
                {data.github && (
                  <a
                    href={data.github.startsWith("http") ? data.github : `https://${data.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#000",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <FaGithub size={16} />
                    {data.githubText || data.github.replace(/https?:\/\/(www\.)?/i, "")}
                  </a>
                )}
                {data.portfolio && (
                  <a href={data.portfolio.startsWith("http") ? data.portfolio : `https://${data.portfolio}`}
                    target="_blank" rel="noopener noreferrer" style={{ color: "#000", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    <FaGlobe size={12} color="#555" /> {data.portfolioText || data.portfolio.replace(/https?:\/\/(www\.)?/i, "")}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── SUMMARY ── */}
          {(editing || data.summary) && (
            <section style={{ marginBottom: 12 }}>
              <SecHead>Summary</SecHead>
              {editing ? (
                <EditArea value={data.summary} onChange={v => set("summary", v)} rows={3}
                  placeholder="Write a compelling 40–80 word summary…" />
              ) : (
                <p style={{ fontSize: 10.5, lineHeight: 1.6, textAlign: "justify" }}>{data.summary}</p>
              )}
            </section>
          )}

          {/* ── EXPERIENCE ── */}
          {(editing || (data.experience || []).length > 0) && (
            <section style={{ marginBottom: 12 }}>
              <SecHead onAdd={editing ? () => addArr("experience", { title: "", company: "", location: "", duration: "", description: "" }) : null} addLabel="Role">
                Experience
              </SecHead>
              {(data.experience || []).map((exp, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  {editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                        <EditText value={exp.title} onChange={v => setArr("experience", i, "title", v)} placeholder="Job Title" fontSize={11} bold />
                        <EditText value={exp.location} onChange={v => setArr("experience", i, "location", v)} placeholder="City, Country" fontSize={9.5} align="right" />
                        <EditText value={exp.duration} onChange={v => setArr("experience", i, "duration", v)} placeholder="Jan 2022 – Present" fontSize={9.5} align="right" />
                      </div>
                      <EditText value={exp.company} onChange={v => setArr("experience", i, "company", v)} placeholder="Company Name" fontSize={10} italic />
                      <EditArea value={exp.description} onChange={v => setArr("experience", i, "description", v)} rows={4}
                        placeholder={"◦ Led team…\n◦ Built REST APIs…\n◦ Reduced deployment time by 60%"} fontSize={10.5} />
                      <button onClick={() => delArr("experience", i)} style={{ alignSelf: "flex-end", color: "#f87171", fontSize: 9, background: "none", border: "none", cursor: "pointer" }}>Remove Role</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, fontSize: 11 }}>{exp.title}</span>
                        <span style={{ fontSize: 10 }}>{exp.location}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontStyle: "italic", fontSize: 10 }}>{exp.company}</span>
                        <span style={{ fontStyle: "italic", fontSize: 10 }}>{exp.duration}</span>
                      </div>
                      {(exp.description || "").split("\n").filter(l => l.trim()).map((line, li) => {
                        const clean = line.replace(/^[◦•\-*▸]\s*/, "");
                        return (
                          <div key={li} style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                            <span style={{ flexShrink: 0, marginTop: 1 }}>◦</span>
                            <span style={{ fontSize: 10.5, lineHeight: 1.55 }}>{clean}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* ── TECHNOLOGIES / SKILLS ── */}
          {(editing || (data.skills || []).length > 0 || (data.skillGroups || []).length > 0) && (
            <section style={{ marginBottom: 12 }}>
              <SecHead onAdd={editing ? () => addArr("skillGroups", { category: "", items: "" }) : null} addLabel="Category">
                Technologies
              </SecHead>

              {/* Skill groups (categorized) */}
              {(data.skillGroups || []).length > 0 ? (
                <>
                  {(data.skillGroups || []).map((grp, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      {editing ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <EditText value={grp.category} onChange={v => setArr("skillGroups", i, "category", v)}
                            placeholder="Category (e.g. Languages)" fontSize={10.5} bold />
                          <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700 }}>:</span>
                          <EditText value={grp.items} onChange={v => setArr("skillGroups", i, "items", v)}
                            placeholder="Skill1, Skill2, Skill3" fontSize={10.5} />
                          <button onClick={() => delArr("skillGroups", i)} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 11, flexShrink: 0 }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10.5 }}>
                          <span style={{ fontWeight: 700 }}>{grp.category}: </span>
                          <span>{grp.items}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                /* Flat skills fallback */
                <div>
                  {editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(data.skills || []).map((sk, i) => (
                        <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <input value={sk} onChange={e => setArr("skills", i, null, e.target.value)}
                            style={{ flex: 1, fontSize: 10, background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 3, padding: "2px 5px", outline: "none", fontFamily: "inherit" }} />
                          <button onClick={() => delArr("skills", i)} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => addArr("skills", "")} style={{ alignSelf: "flex-start", fontSize: 9, color: "#4338ca", background: "#eef2ff", border: "1px solid #a5b4fc", borderRadius: 3, padding: "1px 6px", cursor: "pointer" }}>+ Add Skill</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10.5 }}>{(data.skills || []).join(", ")}</div>
                  )}
                </div>
              )}

              {/* When in edit mode and no skill groups yet, offer to switch */}
              {editing && (data.skillGroups || []).length === 0 && (
                <button onClick={() => addArr("skillGroups", { category: "Languages", items: "" })}
                  style={{ marginTop: 4, fontSize: 9, color: "#4338ca", background: "#eef2ff", border: "1px solid #a5b4fc", borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>
                  + Add category group
                </button>
              )}
            </section>
          )}

          {/* ── PROJECTS ── */}
          {(editing || (data.projects || []).length > 0) && (
            <section style={{ marginBottom: 12 }}>
              <SecHead onAdd={editing ? () => addArr("projects", { name: "", description: "", technologies: [], githubRepo: "", liveLink: "" }) : null} addLabel="Project">
                Projects
              </SecHead>
              {(data.projects || []).map((proj, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  {editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        <EditText value={proj.name} onChange={v => setArr("projects", i, "name", v)} placeholder="Project Name" fontSize={11} bold />
                        <EditText value={proj.githubRepo || ""} onChange={v => setArr("projects", i, "githubRepo", v)} placeholder="GitHub repo URL" fontSize={9.5} align="right" />
                      </div>
                      <EditText value={(proj.technologies || []).join(", ")}
                        onChange={v => setArr("projects", i, "technologies", v.split(",").map(x => x.trim()).filter(Boolean))}
                        placeholder="Tools: React, Node.js, MongoDB…" fontSize={10} italic />
                      <EditArea value={proj.description} onChange={v => setArr("projects", i, "description", v)} rows={3}
                        placeholder={"◦ Developed…\n◦ Implemented…"} fontSize={10.5} />
                      <EditText value={proj.liveLink || ""} onChange={v => setArr("projects", i, "liveLink", v)} placeholder="Live demo URL" fontSize={9.5} />
                      <button onClick={() => delArr("projects", i)} style={{ alignSelf: "flex-end", color: "#f87171", fontSize: 9, background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 700, fontSize: 11 }}>{proj.name}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {proj.githubRepo && (
                            <a href={proj.githubRepo.startsWith("http") ? proj.githubRepo : `https://${proj.githubRepo}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 9.5, color: "#1d4ed8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <FaGithub size={11} /> github
                            </a>
                          )}
                          {proj.liveLink && (
                            <a href={proj.liveLink.startsWith("http") ? proj.liveLink : `https://${proj.liveLink}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 9.5, color: "#1d4ed8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                              <FaExternalLinkAlt size={9} /> live
                            </a>
                          )}
                        </div>
                      </div>
                      {(proj.technologies || []).length > 0 && (
                        <div style={{ fontSize: 10, fontStyle: "italic", marginBottom: 2 }}>
                          ◦ Tools: {proj.technologies.join(", ")}
                        </div>
                      )}
                      {(proj.description || "").split("\n").filter(l => l.trim()).map((line, li) => {
                        const clean = line.replace(/^[◦•\-*▸]\s*/, "");
                        return (
                          <div key={li} style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                            <span style={{ flexShrink: 0, marginTop: 1 }}>◦</span>
                            <span style={{ fontSize: 10.5, lineHeight: 1.55 }}>{clean}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* ── EDUCATION ── */}
          {(editing || (data.education || []).length > 0) && (
            <section style={{ marginBottom: 12 }}>
              <SecHead onAdd={editing ? () => addArr("education", { institution: "", degree: "", year: "", location: "" }) : null} addLabel="Edu">
                Education
              </SecHead>
              {(data.education || []).map((edu, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {editing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        <EditText value={edu.institution} onChange={v => setArr("education", i, "institution", v)} placeholder="University Name" fontSize={11} bold />
                        <EditText value={edu.year} onChange={v => setArr("education", i, "year", v)} placeholder="Nov 2022 – July 2025" fontSize={9.5} align="right" />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        <EditText value={edu.degree} onChange={v => setArr("education", i, "degree", v)} placeholder="B.Tech – Computer Science" fontSize={10} italic />
                        <EditText value={edu.location || ""} onChange={v => setArr("education", i, "location", v)} placeholder="City, State" fontSize={9.5} italic align="right" />
                      </div>
                      {edu.gpa && <EditText value={edu.gpa || ""} onChange={v => setArr("education", i, "gpa", v)} placeholder="GPA (optional)" fontSize={9.5} />}
                      <button onClick={() => delArr("education", i)} style={{ alignSelf: "flex-end", color: "#f87171", fontSize: 9, background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 700, fontSize: 11 }}>{edu.institution}</span>
                        <span style={{ fontSize: 10, fontStyle: "italic" }}>{edu.year}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontStyle: "italic", fontSize: 10 }}>{edu.degree}</span>
                        <span style={{ fontSize: 10 }}>{edu.location}</span>
                      </div>
                      {edu.gpa && <div style={{ fontSize: 10 }}>GPA: {edu.gpa}</div>}
                    </>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* ── CERTIFICATIONS ── */}
          {(editing || (data.certifications || []).length > 0) && (
            <section style={{ marginBottom: 8 }}>
              <SecHead onAdd={editing ? () => addArr("certifications", { name: "", issuer: "", year: "" }) : null} addLabel="Cert">
                Certifications
              </SecHead>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(data.certifications || []).map((cert, i) => {
                    const c = typeof cert === "string" ? { name: cert, issuer: "", year: "" } : cert;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 4, alignItems: "center" }}>
                          <EditText value={c.name || ""} onChange={v => setArr("certifications", i, "name", v)} placeholder="Certification name" fontSize={10.5} />
                          <EditText value={c.issuer || ""} onChange={v => setArr("certifications", i, "issuer", v)} placeholder="Issuer (optional)" fontSize={9.5} />
                          <EditText value={c.year || ""} onChange={v => setArr("certifications", i, "year", v)} placeholder="Year" fontSize={9.5} />
                          <button onClick={() => delArr("certifications", i)} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {(data.certifications || []).map((cert, i) => {
                    const c = typeof cert === "string" ? { name: cert, issuer: null, year: null } : cert;
                    return (
                      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                        <span style={{ flexShrink: 0 }}>◦</span>
                        <span style={{ fontSize: 10.5 }}>
                          {c.name}{c.issuer ? ` — ${c.issuer}` : ""}{c.year ? ` (${c.year})` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── LANGUAGES ── */}
          {(editing || (data.languages || []).length > 0) && (
            <section>
              <SecHead onAdd={editing ? () => addArr("languages", "") : null} addLabel="Language">Languages</SecHead>
              {editing ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(data.languages || []).map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 3, alignItems: "center" }}>
                      <input value={l} onChange={e => setArr("languages", i, null, e.target.value)}
                        style={{ fontSize: 10, background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 3, padding: "2px 5px", outline: "none", fontFamily: "inherit", width: 80 }} />
                      <button onClick={() => delArr("languages", i)} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 11 }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 10.5 }}>{(data.languages || []).join("  •  ")}</div>
              )}
            </section>
          )}

        </div>{/* end A4 sheet */}
      </div>
    </div>
  );
}
