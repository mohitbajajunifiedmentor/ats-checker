export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdf from "pdf-parse-debugging-disabled";
import { prisma } from "@/app/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* -----------------------------
   TEXT NORMALIZATION
------------------------------ */

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -----------------------------
   STOPWORDS
------------------------------ */

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
  "i", "if", "in", "into", "is", "it", "its", "of", "on", "or", "our", "such", "that",
  "the", "their", "then", "there", "these", "they", "this", "to", "was", "we",
  "were", "will", "with", "you", "your"
]);

/* -----------------------------
   KEYWORD EXTRACTION
------------------------------ */

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

/* -----------------------------
   KEYWORD MATCH
------------------------------ */

function keywordDiff({ resumeText, jobDescription }) {

  const resumeKeywords = new Set(
    extractKeywords(resumeText, { max: 150 })
  );

  const jobKeywords = extractKeywords(jobDescription, { max: 60 });

  const matchedKeywords = jobKeywords.filter(k =>
    resumeKeywords.has(k)
  );

  const missingKeywords = jobKeywords.filter(k =>
    !resumeKeywords.has(k)
  );

  return {
    matchedKeywords,
    missingKeywords,
    jobKeywords
  };
}

/* -----------------------------
   ATS SCORE CALCULATION
------------------------------ */

function computeAtsScore({ matchedKeywords, jobKeywords }) {

  const total = jobKeywords.length;

  if (!total) return 0;

  const score = (matchedKeywords.length / total) * 100;

  return Math.round(score);
}

/* -----------------------------
   API ROUTE
------------------------------ */

export async function POST(req) {

  try {

    /* -----------------------------
       GET FORM DATA
    ------------------------------ */

    const formData = await req.formData();

    const file = formData.get("resume");
    const jobDescription = String(formData.get("jobDescription") || "");

    if (!file) {
      return NextResponse.json(
        { error: "No resume uploaded" },
        { status: 400 }
      );
    }

    /* -----------------------------
       FILE VALIDATION
    ------------------------------ */

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 5MB allowed." },
        { status: 400 }
      );
    }

    /* -----------------------------
       PDF TEXT EXTRACTION
    ------------------------------ */

    let resumeText = "";

    try {

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfData = await pdf(buffer);

      resumeText = pdfData.text || "";

    } catch (error) {

      console.error("PDF parsing failed:", error);

      return NextResponse.json(
        { error: "Could not read PDF file." },
        { status: 400 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "No readable text found in PDF." },
        { status: 400 }
      );
    }

    /* -----------------------------
       USER ACCOUNT FROM RESUME EMAIL
    ------------------------------ */

    const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    let userId = null;
    let userEmail = null;

    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: null }
      });
      userId = user.id;
      userEmail = user.email;
    } else {
      // Fallback demo user when no email is found
      const demo = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: { email: "demo@example.com", name: "Demo User" }
      });
      userId = demo.id;
      userEmail = demo.email;
    }

    /* -----------------------------
       KEYWORD ANALYSIS
    ------------------------------ */

    const diff = keywordDiff({
      resumeText,
      jobDescription
    });

    const atsScoreFromKeywords = computeAtsScore({
      matchedKeywords: diff.matchedKeywords,
      jobKeywords: diff.jobKeywords
    });

    /* -----------------------------
       GEMINI AI ANALYSIS
    ------------------------------ */
/* -----------------------------
   GEMINI AI ANALYSIS
------------------------------ */

/* -----------------------------
   GEMINI AI ANALYSIS
------------------------------ */

let analysis = {};

try {

  const prompt = `
You are an ATS (Applicant Tracking System).

Return JSON only:

{
  "atsScore": 78,
  "strengths": [],
  "weaknesses": [],
  "missingKeywords": [],
  "suggestions": []
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

  const model = genAI.getGenerativeModel({
    model: "gemini-pro"
  });

  const result = await model.generateContent(prompt);

  let response = result.response.text();

  response = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    analysis = JSON.parse(response);
  } catch {
    analysis = {};
  }

} catch (error) {

  console.error("Gemini error:", error);

  analysis = {};
}
    /* -----------------------------
       FINAL RESULT
    ------------------------------ */

    const atsScore =
      typeof analysis.atsScore === "number"
        ? analysis.atsScore
        : atsScoreFromKeywords;

    const resultData = {

      atsScore,

      matchedKeywords: diff.matchedKeywords,

      missingKeywords: diff.missingKeywords,

      strengths: analysis.strengths || [],

      weaknesses: analysis.weaknesses || [],

      suggestions: analysis.suggestions || []
    };

    /* -----------------------------
       SAVE TO DATABASE
    ------------------------------ */

    const saved = await prisma.resume.create({

      data: {

        userId: userId,

        fileName: file.name,

        atsScore,

        strengths: resultData.strengths,

        improvements: resultData.weaknesses,

        missingKeywords: resultData.missingKeywords,

        parsedText: resumeText,

        jobDescription: jobDescription || null,

        suggestions: resultData.suggestions
      }
    });

    /* -----------------------------
       RESPONSE
    ------------------------------ */

    return NextResponse.json({

      success: true,

      analysis: resultData,

      resumeId: saved.id,

      userEmail
    });

  } catch (error) {

    console.error("Analysis Error:", error);

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}