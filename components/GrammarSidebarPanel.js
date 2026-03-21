"use client";
import { useState } from "react";

const SECTION_LABELS = {
  summary:        { label: "Summary",        icon: "📝" },
  experience:     { label: "Experience",     icon: "💼" },
  skills:         { label: "Skills",         icon: "🔧" },
  projects:       { label: "Projects",       icon: "🚀" },
  education:      { label: "Education",      icon: "🎓" },
  certifications: { label: "Certifications", icon: "🏆" },
};

const TYPE_STYLE = {
  spelling: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Spelling" },
  grammar:  { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Grammar"  },
  ats:      { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "ATS"      },
  style:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Style"    },
  keyword:  { bg: "#faf5ff", color: "#7c3aed", border: "#ddd6fe", label: "Keyword"  },
};

const SEV_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" };

function ScoreRingSmall({ score }) {
  const sz = 68, r = 26, circ = 2 * Math.PI * r;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const track = score >= 70 ? "#064e3b" : score >= 40 ? "#451a03" : "#3b0d0d";
  const filled = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: sz, height: sz }}>
      <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={track} strokeWidth={7}/>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color}60)` }}/>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 15, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 7.5, color: "#64748b", marginTop: 1 }}>/ 100</span>
      </div>
    </div>
  );
}

export default function GrammarSidebarPanel({ result, onCorrect, onDismiss }) {
  const [expanded, setExpanded] = useState(null);

  if (!result) return null;

  const { overallScore = 0, sections = {} } = result;

  const totalIssues = Object.values(sections).reduce(
    (acc, s) => acc + (s.issues?.length || 0), 0
  );
  const highCount = Object.values(sections).reduce(
    (acc, s) => acc + (s.issues || []).filter(i => i.severity === "high").length, 0
  );

  return (
    <div style={{
      width: 268, flexShrink: 0,
      background: "#0c1525",
      borderRadius: 14,
      border: "1px solid #1e293b",
      display: "flex", flexDirection: "column",
      maxHeight: 860,
      boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      fontSize: 12,
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>Resume Analysis</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
              {totalIssues === 0 ? "No issues found 🎉" : `${totalIssues} issue${totalIssues !== 1 ? "s" : ""} found`}
              {highCount > 0 && <span style={{ color: "#ef4444", marginLeft: 5 }}>· {highCount} critical</span>}
            </div>
          </div>
          <button onClick={onDismiss} style={{
            background: "none", border: "none", color: "#475569",
            cursor: "pointer", fontSize: 17, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* ATS Score */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ScoreRingSmall score={overallScore}/>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>Overall ATS Score</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>
              {overallScore >= 70
                ? "✅ Ready to apply"
                : overallScore >= 40
                ? "⚠ Needs improvement"
                : "❌ Needs major work"}
            </div>
            {totalIssues > 0 && (
              <div style={{ fontSize: 9.5, color: "#475569", marginTop: 3 }}>
                Fix issues below to boost score
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {Object.entries(SECTION_LABELS).map(([key, { label, icon }]) => {
          const sec = sections[key];
          if (!sec) return null;

          const issues = sec.issues || [];
          const score  = sec.score ?? 100;
          const isOpen = expanded === key;
          const highIssues = issues.filter(i => i.severity === "high").length;

          return (
            <div key={key}>
              {/* Section row */}
              <div
                onClick={() => setExpanded(isOpen ? null : key)}
                style={{
                  padding: "9px 16px",
                  cursor: issues.length > 0 ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 10,
                  borderLeft: isOpen ? "3px solid #7c3aed" : "3px solid transparent",
                  background: isOpen ? "#111827" : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (issues.length > 0) e.currentTarget.style.background = "#0f172a"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isOpen ? "#111827" : "transparent"; }}
              >
                {/* Score pill */}
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: score >= 70 ? "#052e16" : score >= 40 ? "#451a03" : "#3b0d0d",
                  border: `2px solid ${score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800,
                  color: score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444",
                }}>
                  {score}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#e2e8f0" }}>
                    {icon} {label}
                  </div>
                  {issues.length === 0 ? (
                    <div style={{ fontSize: 9.5, color: "#10b981" }}>✓ Looks great</div>
                  ) : (
                    <div style={{ fontSize: 9.5, color: "#94a3b8" }}>
                      {issues.length} issue{issues.length !== 1 ? "s" : ""}
                      {highIssues > 0 && (
                        <span style={{ color: "#ef4444", marginLeft: 4 }}>· {highIssues} critical</span>
                      )}
                    </div>
                  )}
                </div>

                {issues.length > 0 && (
                  <span style={{
                    fontSize: 9, color: "#475569",
                    transform: isOpen ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s", display: "inline-block",
                  }}>▶</span>
                )}
              </div>

              {/* Expanded issue list */}
              {isOpen && issues.length > 0 && (
                <div style={{ padding: "4px 12px 10px", background: "#080e1a" }}>
                  {issues.map((issue, i) => {
                    const tc = TYPE_STYLE[issue.type] || TYPE_STYLE.style;
                    return (
                      <div key={i} style={{
                        marginBottom: 6, padding: "8px 10px",
                        background: "#0f172a", borderRadius: 8,
                        border: "1px solid #1e293b",
                        borderLeft: `3px solid ${SEV_COLOR[issue.severity] || "#64748b"}`,
                      }}>
                        {/* Header row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{
                            fontSize: 8.5, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                            background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                          }}>
                            {tc.label}
                          </span>
                          <span style={{
                            fontSize: 8, fontWeight: 700, textTransform: "uppercase",
                            color: SEV_COLOR[issue.severity] || "#64748b",
                            letterSpacing: "0.05em",
                          }}>
                            {issue.severity}
                          </span>
                        </div>

                        {/* Correction */}
                        {issue.original && (
                          <div style={{ fontSize: 10, marginBottom: 4, lineHeight: 1.4 }}>
                            <span style={{ color: "#f87171", textDecoration: "line-through" }}>
                              "{issue.original}"
                            </span>
                            {issue.correction && (
                              <>
                                <span style={{ color: "#475569", margin: "0 4px" }}>→</span>
                                <span style={{ color: "#34d399", fontWeight: 600 }}>
                                  "{issue.correction}"
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Explanation */}
                        <div style={{ fontSize: 9.5, color: "#64748b", lineHeight: 1.45, marginBottom: issue.correction ? 6 : 0 }}>
                          {issue.explanation}
                        </div>

                        {/* Apply button */}
                        {issue.correction && (
                          <button
                            onClick={() => onCorrect(issue)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 9, fontWeight: 700, padding: "3px 9px",
                              borderRadius: 5, border: "1px solid #10b981",
                              background: "#052e16", color: "#10b981",
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#064e3b"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#052e16"; }}
                          >
                            ✓ Apply Fix
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "9px 14px", borderTop: "1px solid #1e293b",
        fontSize: 8.5, color: "#334155", textAlign: "center",
      }}>
        Hover highlighted text to see suggestions · Click or use Apply Fix to correct
      </div>
    </div>
  );
}
