"use client";
import { useState, useCallback } from "react";

/* Build segments array: splits text into plain and highlighted chunks */
function buildSegments(text, issues) {
  if (!text || !issues || issues.length === 0) return [{ text, highlighted: false }];

  const relevant = issues.filter(iss => iss.original && text.includes(iss.original));
  if (relevant.length === 0) return [{ text, highlighted: false }];

  // Find all match positions
  const positions = [];
  for (const issue of relevant) {
    let searchFrom = 0;
    while (searchFrom < text.length) {
      const idx = text.indexOf(issue.original, searchFrom);
      if (idx === -1) break;
      positions.push({ start: idx, end: idx + issue.original.length, issue });
      searchFrom = idx + issue.original.length;
    }
  }

  // Sort by start, remove overlaps
  positions.sort((a, b) => a.start - b.start);
  const filtered = [];
  let lastEnd = 0;
  for (const pos of positions) {
    if (pos.start >= lastEnd) {
      filtered.push(pos);
      lastEnd = pos.end;
    }
  }

  // Build segments
  const segments = [];
  let cursor = 0;
  for (const { start, end, issue } of filtered) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: text.slice(start, end), highlighted: true, issue });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });

  return segments;
}

const SEVERITY_COLOR = {
  high:   { underline: "#ef4444", bg: "#fef2f2" },
  medium: { underline: "#f59e0b", bg: "#fffbeb" },
  low:    { underline: "#3b82f6", bg: "#eff6ff" },
};

const TYPE_LABEL = {
  spelling: "Spelling",
  grammar:  "Grammar",
  ats:      "ATS",
  style:    "Style",
  keyword:  "Keyword",
};

export default function HighlightedText({ text, issues, onCorrect, style = {} }) {
  const [tooltip, setTooltip] = useState(null); // { idx, x, y }

  const handleMouseEnter = useCallback((e, idx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      idx,
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 230),
      y: rect.top - 6,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const handleClick = useCallback((e, issue) => {
    e.stopPropagation();
    if (issue.correction && onCorrect) {
      onCorrect(issue);
      setTooltip(null);
    }
  }, [onCorrect]);

  if (!text) return null;

  const segments = buildSegments(text, issues || []);

  return (
    <span style={style}>
      {segments.map((seg, idx) => {
        if (!seg.highlighted) return <span key={idx}>{seg.text}</span>;

        const { issue } = seg;
        const colors = SEVERITY_COLOR[issue.severity] || SEVERITY_COLOR.medium;
        const hasCorrection = !!issue.correction;
        const isActive = tooltip?.idx === idx;

        return (
          <span key={idx} style={{ position: "relative", display: "inline" }}>
            <span
              style={{
                background: isActive ? colors.bg : "transparent",
                borderBottom: `2px ${issue.type === "grammar" || issue.type === "spelling" ? "solid" : "dashed"} ${colors.underline}`,
                cursor: hasCorrection ? "pointer" : "help",
                borderRadius: 2,
                padding: "0 1px",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => handleMouseEnter(e, idx)}
              onMouseLeave={handleMouseLeave}
              onClick={e => handleClick(e, issue)}
            >
              {seg.text}
            </span>

            {/* Tooltip */}
            {isActive && (
              <span
                style={{
                  position: "fixed",
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(-50%, -100%)",
                  background: "#1e293b",
                  color: "#f1f5f9",
                  borderRadius: 8,
                  padding: "8px 11px",
                  fontSize: 10,
                  zIndex: 9999,
                  boxShadow: "0 4px 20px rgba(0,0,0,.5)",
                  pointerEvents: "none",
                  minWidth: 140,
                  maxWidth: 240,
                  lineHeight: 1.5,
                  border: "1px solid #334155",
                }}
              >
                {/* Type badge */}
                <span style={{
                  fontSize: 8.5, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                  background: issue.type === "spelling" || issue.type === "grammar" ? "#fef2f2" : "#eff6ff",
                  color: issue.type === "spelling" || issue.type === "grammar" ? "#dc2626" : "#2563eb",
                  display: "inline-block", marginBottom: 5,
                }}>
                  {TYPE_LABEL[issue.type] || issue.type}
                </span>

                {/* Correction */}
                {hasCorrection && (
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#f87171", textDecoration: "line-through" }}>{issue.original}</span>
                    <span style={{ color: "#94a3b8", margin: "0 4px" }}>→</span>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>{issue.correction}</span>
                  </div>
                )}

                {/* Explanation */}
                <div style={{ color: "#94a3b8", fontSize: 9.5 }}>{issue.explanation}</div>

                {/* Click hint */}
                {hasCorrection && (
                  <div style={{
                    marginTop: 5, fontSize: 9, color: "#60a5fa",
                    borderTop: "1px solid #334155", paddingTop: 4,
                  }}>
                    👆 Click to apply fix
                  </div>
                )}

                {/* Arrow */}
                <span style={{
                  position: "absolute", top: "100%", left: "50%",
                  transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid #1e293b",
                }}/>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
