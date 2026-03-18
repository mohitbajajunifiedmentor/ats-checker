export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse-debugging-disabled";
import { PDFDocument, rgb } from "pdf-lib";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeText(text) {
  return (text || "").toLowerCase().replace(/[^\u0000-\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
  "i", "if", "in", "into", "is", "it", "its", "of", "on", "or", "our", "such", "that",
  "the", "their", "then", "there", "these", "they", "this", "to", "was", "we", "were", "will", "with", "you", "your"
]);

function extractKeywords(text, { minLen = 3, max = 50 } = {}) {
  const norm = normalizeText(text);
  if (!norm) return [];
  const counts = new Map();
  for (const token of norm.split(" ")) {
    if (token.length < minLen) continue;
    if (STOPWORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

function keywordDiff({ resumeText, jobDescription }) {
  const resumeKeywords = new Set(extractKeywords(resumeText, { max: 150 }));
  const jobKeywords = extractKeywords(jobDescription, { max: 60 });

  const matchedKeywords = jobKeywords.filter((k) => resumeKeywords.has(k));
  const missingKeywords = jobKeywords.filter((k) => !resumeKeywords.has(k));

  return { matchedKeywords, missingKeywords, jobKeywords };
}

function computeAtsScore({ matchedKeywords, jobKeywords }) {
  const total = jobKeywords.length;
  if (!total) return 70;
  const score = (matchedKeywords.length / total) * 100;
  return Math.round(score);
}

async function parseResumeText(buffer) {
  try {
    const data = await pdf(buffer);
    let text = data.text || "";
    if (text.length > 50000) text = text.substring(0, 50000);
    return text;
  } catch {
    return "";
  }
}

function sanitizeForWinAnsi(text) {
  return text
    .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u00A0]/g, ' ')
    .replace(/[\u0080-\uFFFF]/g, '');
}

function generatePDFBuffer(text) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 11;
      const margin = 40;
      const maxWidth = width - 2 * margin;

      const safeText = sanitizeForWinAnsi(text);

      page.drawText(safeText, {
        x: margin,
        y: height - margin,
        size: fontSize,
        color: rgb(0, 0, 0),
        maxWidth,
      });

      const pdfBytes = await pdfDoc.save();
      resolve(Buffer.from(pdfBytes));
    } catch (error) {
      reject(error);
    }
  });
}

function sanitizeData(data) {
  return {
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    address: data.address || null,
    linkedin: data.linkedin || null,
    github: data.github || null,
    portfolio: data.portfolio || null,
    summary: data.summary || null,
    education: Array.isArray(data.education) ? data.education : [],
    experience: Array.isArray(data.experience) ? data.experience : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
  };
}

export async function POST(req) {
  try {
    const { base64Resume, jobDescription, focus } = await req.json();

    if (!base64Resume) {
      return NextResponse.json({ error: "Missing resume data" }, { status: 400 });
    }

    const buffer = Buffer.from(base64Resume, "base64");
    const resumeText = await parseResumeText(buffer);

    const keywords = keywordDiff({ resumeText, jobDescription });
    const originalScore = computeAtsScore({ matchedKeywords: keywords.matchedKeywords, jobKeywords: keywords.jobKeywords });

    const prompt = `You are an expert resume writer. Improve the resume in the following focus area: ${focus}.\n\nJob Description:\n${jobDescription}\n\nResume Text:\n${resumeText}\n\nReturn the improved resume as plain text. Do not include any analysis or explanation.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const improvedText = response.choices[0].message.content.trim();
    const improvedKeywords = keywordDiff({ resumeText: improvedText, jobDescription });
    const improvedScore = computeAtsScore({ matchedKeywords: improvedKeywords.matchedKeywords, jobKeywords: improvedKeywords.jobKeywords });
    const improvement = Math.round(improvedScore - originalScore);

    const pdfBuffer = await generatePDFBuffer(improvedText);
    const pdfBase64 = pdfBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      optimized: {
        score: improvedScore,
        improvement,
        pdfBase64,
        suggestions: [
          `Focus applied: ${focus}`,
          `Improved keywords: ${improvedKeywords.matchedKeywords.length} matched`,
        ],
      },
    });
  } catch (error) {
    console.error("Enhance Error:", error);
    return NextResponse.json({ error: "Enhancement failed" }, { status: 500 });
  }
}
