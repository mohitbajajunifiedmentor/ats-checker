"use client";
import { useState, useRef } from "react";

const SHIMMER = `
  @keyframes aiShimmer {
    0% { background-position: -200% 0 }
    100% { background-position: 200% 0 }
  }
`;

export default function AISuggestPanel({ section, context, onApply, label }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [justApplied, setJustApplied] = useState(null);
  const fetchedRef = useRef(false);

  const fetchSuggestions = async (ctx) => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    fetchedRef.current = false;
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, context: ctx }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSuggestions(json.suggestions);
      fetchedRef.current = true;
    } catch (e) {
      setError(e.message || "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!fetchedRef.current && !loading) fetchSuggestions(context);
  };

  const handleApply = (s) => {
    onApply(s);
    setJustApplied(s);
    setTimeout(() => setJustApplied(null), 1400);
  };

  const handleRefresh = () => {
    fetchedRef.current = false;
    fetchSuggestions(context);
  };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        title="Get AI-powered suggestions for this section"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 9, fontWeight: 700, color: "#6d28d9",
          background: "#f5f3ff", border: "1px solid #ddd6fe",
          borderRadius: 99, padding: "2px 9px", cursor: "pointer",
          marginBottom: 5, transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#ede9fe"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f5f3ff"; }}
      >
        ✨ {label || "AI Suggest"}
      </button>
    );
  }

  return (
    <div style={{
      marginBottom: 7,
      borderRadius: 8,
      border: "1px solid #ddd6fe",
      background: "#faf5ff",
      padding: "8px 10px",
    }}>
      <style>{SHIMMER}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "#7c3aed",
            animation: loading ? "pulse 1s infinite" : "none",
            display: "inline-block",
          }}/>
          {loading ? "Generating suggestions…" : "✨ AI Suggestions"}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {!loading && fetchedRef.current && (
            <button
              onClick={handleRefresh}
              title="Regenerate suggestions"
              style={{ fontSize: 9, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ↺ Refresh
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            style={{ fontSize: 13, lineHeight: 1, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {[110, 150, 130, 90, 170].map((w, i) => (
            <div key={i} style={{
              height: 22, width: w, borderRadius: 4,
              background: "linear-gradient(90deg, #ede9fe 25%, #ddd6fe 50%, #ede9fe 75%)",
              backgroundSize: "200% 100%",
              animation: `aiShimmer 1.3s ease-in-out ${i * 0.1}s infinite`,
            }}/>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ fontSize: 9, color: "#dc2626", display: "flex", alignItems: "center", gap: 5 }}>
          <span>⚠ {error}</span>
          <button onClick={handleRefresh} style={{ fontSize: 9, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Try again
          </button>
        </div>
      )}

      {/* Suggestions chips */}
      {suggestions && !loading && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {suggestions.map((s, i) => {
              const applied = justApplied === s;
              return (
                <button
                  key={i}
                  onClick={() => handleApply(s)}
                  title={s}
                  style={{
                    fontSize: 9, textAlign: "left",
                    color: applied ? "#fff" : "#4c1d95",
                    background: applied ? "#7c3aed" : "#ede9fe",
                    border: `1px solid ${applied ? "#7c3aed" : "#c4b5fd"}`,
                    borderRadius: 4,
                    padding: "3px 9px",
                    cursor: "pointer",
                    maxWidth: 340,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => { if (!applied) { e.currentTarget.style.background = "#ddd6fe"; } }}
                  onMouseLeave={e => { if (!applied) { e.currentTarget.style.background = "#ede9fe"; } }}
                >
                  {applied ? "✓ Added!" : (s.length > 80 ? s.slice(0, 77) + "…" : s)}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 8, color: "#a78bfa", marginTop: 6, marginBottom: 0 }}>
            Click a suggestion to apply it · You can apply multiple
          </p>
        </>
      )}
    </div>
  );
}
