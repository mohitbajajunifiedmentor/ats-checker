import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPTS = {
  summary: (ctx) =>
    `You are a professional resume writer. Generate 3 alternative professional summary paragraphs (each 40–65 words) for a resume.
Person context: Name: ${ctx.name || "—"}, Target role: ${ctx.role || "professional"}, Skills: ${ctx.skills || "—"}, Job target: ${ctx.jobDescription || "general professional role"}.
Each summary should be unique in angle (results-focused, leadership-focused, skills-focused).
Return ONLY a valid JSON array of 3 strings. No markdown, no explanation.`,

  experience_bullets: (ctx) =>
    `You are a professional resume coach. Generate 5 strong achievement-focused bullet points for the role "${ctx.role || "professional"}" at "${ctx.company || "a company"}".
Use past-tense action verbs. Quantify results where possible (%, $, numbers, users, time saved). Keep each bullet under 20 words.
Job target: ${ctx.jobDescription || "not specified"}.
Return ONLY a valid JSON array of 5 strings (no bullet prefix). No markdown, no explanation.`,

  skills: (ctx) =>
    `You are a professional resume coach. Suggest 8 highly relevant technical and soft skills for the role: "${ctx.role || "professional"}".
Current skills already on resume: ${ctx.currentSkills || "none listed"}.
Do NOT suggest skills already listed. Mix technical, tools, and soft skills.
Return ONLY a valid JSON array of 8 short skill strings (1–3 words each). No markdown, no explanation.`,

  project_description: (ctx) =>
    `You are a professional resume writer. Generate 4 strong bullet points describing a software project named "${ctx.projectName || "a project"}" using technologies: ${ctx.technologies || "not specified"}.
Each bullet should be one concise line, starting with an action verb, showing impact.
Return ONLY a valid JSON array of 4 strings (no bullet prefix). No markdown, no explanation.`,

  certifications: (ctx) =>
    `You are a career advisor. Suggest 5 relevant professional certifications for someone in the role: "${ctx.role || "professional"}".
Current skills: ${ctx.currentSkills || "—"}.
Return ONLY a valid JSON array of 5 strings formatted as "Certification Name — Issuing Organization". No markdown, no explanation.`,
};

export async function POST(req) {
  try {
    const { section, context } = await req.json();

    const buildPrompt = PROMPTS[section];
    if (!buildPrompt) {
      return NextResponse.json({ error: "Unknown section" }, { status: 400 });
    }

    const prompt = buildPrompt(context || {});

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 700,
    });

    const raw = result.choices[0].message.content.trim();
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const suggestions = JSON.parse(clean);

    if (!Array.isArray(suggestions)) throw new Error("Response was not an array");

    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Failed to generate suggestions" }, { status: 500 });
  }
}
