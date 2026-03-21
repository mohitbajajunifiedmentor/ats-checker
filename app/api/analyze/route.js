export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse-debugging-disabled";
import { prisma } from "@/app/lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -----------------------------
   FALLBACK ATS ANALYSIS
------------------------------ */

function performFallbackAnalysis(resumeText, jobDescription) {
  const diff = keywordDiff({
    resumeText,
    jobDescription
  });

  const atsScore = computeAtsScore({
    matchedKeywords: diff.matchedKeywords,
    jobKeywords: diff.jobKeywords
  });

  // Generate basic analysis
  const analysis = {
    atsScore,
    summary: `Basic ATS analysis completed. Found ${diff.matchedKeywords.length} matching keywords out of ${diff.jobKeywords.length} total keywords.`,
    strengths: [
      `Resume contains ${diff.matchedKeywords.length} relevant keywords`,
      atsScore > 70 ? "Good keyword match with job requirements" : "Some relevant keywords found"
    ],
    weaknesses: [
      `Missing ${diff.missingKeywords.length} important keywords`,
      atsScore < 50 ? "Low keyword relevance to job description" : "Could improve keyword matching"
    ],
    missingKeywords: diff.missingKeywords.slice(0, 10),
    suggestions: [
      "Consider adding more job-specific keywords",
      "Review job description and incorporate relevant terms",
      "Use industry-standard terminology",
      "Ensure keywords appear naturally in context"
    ]
  };

  console.log("Fallback ATS analysis completed:", {
    score: atsScore,
    matched: diff.matchedKeywords.length,
    missing: diff.missingKeywords.length
  });

  return analysis;
}

function extractDataWithRegex(text) {
  const data = {
    name: null,
    headline: null,
    email: null,
    phone: null,
    address: null,
    linkedin: null,
    linkedinText: null,
    github: null,
    githubText: null,
    portfolio: null,
    portfolioText: null,
    summary: null,
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: []
  };

  // Extract email
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) {
    data.email = emailMatch[0].toLowerCase();
  }

  // Extract phone number
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
  if (phoneMatch) {
    data.phone = phoneMatch[0];
  }

  // Extract LinkedIn — match with or without https://www. prefix
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_%-]+)/i);
  if (linkedinMatch) {
    const username = linkedinMatch[1];
    data.linkedin = `https://linkedin.com/in/${username}`;
    data.linkedinText = username;
  }

  // Extract GitHub — match with or without https://www. prefix
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i);
  if (githubMatch) {
    const username = githubMatch[1];
    data.github = `https://github.com/${username}`;
    data.githubText = username;
  }

  // Extract portfolio/website (skip linkedin/github already captured)
  const portfolioMatch = text.match(/https?:\/\/(?!(?:www\.)?linkedin\.com)(?!(?:www\.)?github\.com)[^\s<>"]+\.(?:com|net|org|io|dev|me|co)[^\s<>".]*/i);
  if (portfolioMatch) {
    data.portfolio = portfolioMatch[0];
  }

  // Extract skills (common tech skills)
  const skillKeywords = [
    'javascript', 'python', 'java', 'c\\+\\+', 'c#', 'php', 'ruby', 'go', 'rust',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring',
    'html', 'css', 'sass', 'bootstrap', 'tailwind',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
    'linux', 'windows', 'macos'
  ];

  const foundSkills = [];
  const lowerText = text.toLowerCase();
  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  data.skills = [...new Set(foundSkills)]; // Remove duplicates

  // Try to extract name (usually at the top)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Check if first line looks like a name (2-3 words, title case)
    if (firstLine.split(' ').length <= 4 && firstLine.length < 50) {
      data.name = firstLine;
    }
  }

  // Extract education keywords
  const educationKeywords = ['bachelor', 'master', 'phd', 'b.tech', 'm.tech', 'bsc', 'msc', 'mba', 'bcom', 'mcom'];
  const educationLines = [];
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
      educationLines.push(line.trim());
    }
  });

  if (educationLines.length > 0) {
    data.education = educationLines.slice(0, 2).map(line => ({
      degree: line,
      institution: 'Not specified',
      year: 'Not specified',
      gpa: null
    }));
  }

  console.log("Fallback extraction completed:", {
    email: !!data.email,
    phone: !!data.phone,
    skillsCount: data.skills.length,
    name: !!data.name
  });

  return data;
}

function sanitizeForDatabase(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\u0000/g, "")                       // null bytes — PostgreSQL UTF-8 rejects these
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "") // other control chars
    .replace(/\s+/g, " ")
    .trim();
}

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
   ATS SCORE
------------------------------ */

function computeAtsScore({ matchedKeywords, jobKeywords }) {

  const total = jobKeywords.length;

  if (!total) return 70;

  const score = (matchedKeywords.length / total) * 100;

  return Math.round(score);
}

/* -----------------------------
   API ROUTE
------------------------------ */

export async function POST(req) {

  try {

    const formData = await req.formData();

    const file = formData.get("resume");
    const jobDescription = String(formData.get("jobDescription") || "");

    let fallbackUsed = false; // Track if fallback methods were used

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
        { error: "Only PDF supported" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    /* -----------------------------
       PDF PARSE
    ------------------------------ */

    let resumeText = "";

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check if buffer is too large for memory
      if (buffer.length > 10 * 1024 * 1024) { // 10MB limit for processing
        return NextResponse.json(
          { error: "File too large to process (max 10MB)" },
          { status: 400 }
        );
      }

      const pdfData = await pdf(buffer);

      resumeText = pdfData.text || "";

      // Limit text length to prevent memory issues
      if (resumeText.length > 50000) { // ~50KB text limit
        resumeText = resumeText.substring(0, 50000) + "...";
      }

    } catch (err) {

      console.error("PDF parse error:", err);

      if (err.message && err.message.includes("allocation")) {
        return NextResponse.json(
          { error: "File too large or corrupted. Please try a smaller PDF." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Unable to read PDF" },
        { status: 400 }
      );
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "PDF contains no readable text" },
        { status: 400 }
      );
    }

    /* -----------------------------
       EXTRACT STRUCTURED DATA
    ------------------------------ */

    let structuredData = {};

    try {

      const extractPrompt = `
You are a professional resume parser. Extract ALL available information from the resume text below.

IMPORTANT: Return ONLY valid JSON with this exact structure. Do not include any explanations or additional text.

For LinkedIn and GitHub, look carefully — they may appear as plain text URLs (e.g., linkedin.com/in/username or github.com/username), with or without https://. Always return the full https:// URL.

{
  "name": "Full name as it appears on resume or null",
  "headline": "Professional title / job title shown under the name (e.g. 'Software Engineer', 'Data Scientist') or null",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "address": "City, State/Country or full address or null",
  "linkedin": "Full LinkedIn URL starting with https:// (e.g. https://linkedin.com/in/username) — look for linkedin.com anywhere in the text or null",
  "linkedinText": "LinkedIn username or display text (e.g. 'username') — just the part after /in/ or null",
  "github": "Full GitHub URL starting with https:// (e.g. https://github.com/username) — look for github.com anywhere in the text or null",
  "githubText": "GitHub username or display text (e.g. 'johndoe') — just the part after github.com/ or null",
  "portfolio": "Portfolio or personal website URL (not linkedin or github) or null",
  "portfolioText": "Portfolio display text as shown on the resume or null",
  "summary": "Professional summary/objective section text or null",
  "education": [
    {
      "degree": "Degree name (e.g., Bachelor of Science in Computer Science)",
      "institution": "University/College name",
      "year": "Graduation year or date range (e.g., 2020-2024)",
      "gpa": "GPA if mentioned or null"
    }
  ],
  "experience": [
    {
      "title": "Job title/position",
      "company": "Company name",
      "duration": "Employment period (e.g., Jan 2022 - Present)",
      "description": "Detailed job responsibilities and achievements as bullet points"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description and technologies used",
      "technologies": ["Technology 1", "Technology 2"],
      "githubRepo": "GitHub repository URL for this specific project or null",
      "liveLink": "Live demo / deployed URL for this project or null"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year obtained"
    }
  ],
  "languages": ["Language 1", "Language 2"]
}

Resume Text:
${resumeText}
`;

      const extractResult = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a precise resume parser. Return valid JSON only — no markdown, no extra text."
          },
          {
            role: "user",
            content: extractPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      });

      let extractResponse = extractResult.choices[0].message.content;

      extractResponse = extractResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        structuredData = JSON.parse(extractResponse);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.log("Raw response:", extractResponse.substring(0, 500));
        structuredData = {};
      }

      // Supplement: if AI missed LinkedIn/GitHub, try regex on the raw text
      if (!structuredData.linkedin) {
        const liMatch = resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_%-]+)/i);
        if (liMatch) {
          structuredData.linkedin = `https://linkedin.com/in/${liMatch[1]}`;
          structuredData.linkedinText = structuredData.linkedinText || liMatch[1];
        }
      }
      if (!structuredData.github) {
        const ghMatch = resumeText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i);
        if (ghMatch) {
          structuredData.github = `https://github.com/${ghMatch[1]}`;
          structuredData.githubText = structuredData.githubText || ghMatch[1];
        }
      }

    } catch (error) {

      console.error("AI extraction failed:", error.message);

      // Fallback: Basic regex-based extraction when AI fails
      console.log("Using fallback extraction methods...");

      structuredData = extractDataWithRegex(resumeText);
      fallbackUsed = true; // Mark that fallback was used
    }

    // Ensure structured data has proper defaults
    structuredData = {
      name: structuredData.name || null,
      headline: structuredData.headline || null,
      email: structuredData.email || null,
      phone: structuredData.phone || null,
      address: structuredData.address || null,
      linkedin: structuredData.linkedin || null,
      linkedinText: structuredData.linkedinText || null,
      github: structuredData.github || null,
      githubText: structuredData.githubText || null,
      portfolio: structuredData.portfolio || null,
      portfolioText: structuredData.portfolioText || null,
      summary: structuredData.summary || null,
      education: Array.isArray(structuredData.education) ? structuredData.education : [],
      experience: Array.isArray(structuredData.experience) ? structuredData.experience : [],
      projects: Array.isArray(structuredData.projects) ? structuredData.projects : [],
      skills: Array.isArray(structuredData.skills) ? structuredData.skills : [],
      certifications: Array.isArray(structuredData.certifications) ? structuredData.certifications : [],
      languages: Array.isArray(structuredData.languages) ? structuredData.languages : []
    };

    // Log extracted data for debugging
    console.log("Validated structured data:", {
      name: structuredData.name,
      email: structuredData.email,
      skillsCount: structuredData.skills?.length || 0,
      experienceCount: structuredData.experience?.length || 0,
      educationCount: structuredData.education?.length || 0
    });

    /* -----------------------------
       USER DETECTION
    ------------------------------ */

    let userId = null;
    let userEmail = null;

    // Use extracted email or fallback to regex
    const extractedEmail = structuredData.email;
    const emailMatch = extractedEmail || resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

    if (emailMatch) {

      const email = (typeof emailMatch === 'string' ? emailMatch : emailMatch[0]).toLowerCase();

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: structuredData.name || null }
      });

      userId = user.id;
      userEmail = user.email;

    } else {

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
       GEMINI ANALYSIS
    ------------------------------ */

    /* ── Weighted base score (used as fallback if AI call fails) ── */
    const hasSummary     = structuredData.summary && structuredData.summary.split(/\s+/).length >= 20;
    const hasExp         = (structuredData.experience || []).length > 0;
    const expWithDesc    = (structuredData.experience || []).filter(e => (e.description||"").length > 80).length;
    const hasEdu         = (structuredData.education  || []).length > 0;
    const hasSkills      = (structuredData.skills     || []).length >= 5;
    const hasContact     = !!(structuredData.email && structuredData.phone);
    const sectionBonus   = [hasSummary, hasExp, hasEdu, hasSkills, hasContact].filter(Boolean).length * 2;
    const expQualityBonus = hasExp ? Math.round((expWithDesc / Math.max((structuredData.experience||[]).length,1)) * 6) : 0;
    const computedScore  = Math.min(99, Math.max(5, Math.round(atsScoreFromKeywords * 0.7 + sectionBonus + expQualityBonus)));

    let analysis = {};

    try {

      const prompt = `You are a professional ATS (Applicant Tracking System) evaluator.

Analyze the resume against the job description and return ONLY valid JSON (no markdown, no extra text).

SCORING RUBRIC (total 100 pts):
- Keyword match (40 pts): how many job description keywords appear in the resume
- Summary quality (15 pts): 40-80 words, job-specific, quantified achievements
- Experience quality (25 pts): bullet points, action verbs, measurable results, relevance to JD
- Skills match (10 pts): skills align with job requirements
- Contact & completeness (5 pts): name, email, phone, LinkedIn present
- Education (5 pts): degree relevant or present

Our keyword analysis found: ${diff.matchedKeywords.length} matched / ${diff.jobKeywords.length} total JD keywords.
Computed base score: ${computedScore}.

Use the rubric above to arrive at a final atsScore. Adjust the base score up or down by at most 15 points based on qualitative factors.

Return this JSON structure:
{
  "atsScore": <final integer 0-100>,
  "overallSummary": "<2-3 sentence honest assessment of the resume vs this job>",
  "strengths": [
    "<specific strength with reference to actual resume content>",
    "<another specific strength>"
  ],
  "suggestions": [
    "<SPECIFIC actionable suggestion — name the exact section and what to change. E.g.: 'In your Work Experience at Acme Corp, replace the vague description with bullet points starting with action verbs like: • Reduced API latency by 40% by implementing Redis caching'>",
    "<SPECIFIC suggestion 2>",
    "<SPECIFIC suggestion 3>",
    "<SPECIFIC suggestion 4>"
  ],
  "sectionScores": {
    "summary": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "contact": <0-100>
  },
  "sectionFeedback": {
    "summary": "<one sentence: what's good and what's missing in the summary>",
    "experience": "<one sentence: quality of experience descriptions>",
    "skills": "<one sentence: skill gaps vs the job description>",
    "education": "<one sentence: education match>"
  }
}

RESUME:
${resumeText.substring(0, 6000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}
`;

      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert ATS evaluator. Return valid JSON only. Give specific, actionable feedback referring to the actual resume content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.15,
        max_tokens: 2000,
      });

      let response = result.choices[0].message.content;

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

      console.error("AI analysis failed:", error.message);

      // Fallback: Basic keyword matching when AI fails
      console.log("Using fallback ATS analysis...");

      const fallbackAnalysis = performFallbackAnalysis(resumeText, jobDescription);
      analysis = {
        atsScore: fallbackAnalysis.atsScore,
        overallSummary: fallbackAnalysis.summary,
        sections: {},
        strengths: fallbackAnalysis.strengths,
        weaknesses: fallbackAnalysis.weaknesses,
        missingKeywords: fallbackAnalysis.missingKeywords,
        suggestions: fallbackAnalysis.suggestions
      };
    }

    /* -----------------------------
       FINAL RESULT
    ------------------------------ */

    const atsScore =
      typeof analysis.atsScore === "number"
        ? Math.min(99, Math.max(1, analysis.atsScore))
        : computedScore;

    const resultData = {
      atsScore,
      overallSummary:  analysis.overallSummary  || "",
      sections:        analysis.sections        || null,
      sectionScores:   analysis.sectionScores   || null,
      sectionFeedback: analysis.sectionFeedback || null,
      matchedKeywords: diff.matchedKeywords,
      missingKeywords: diff.missingKeywords,
      strengths:       analysis.strengths  || [],
      weaknesses:      analysis.weaknesses || [],
      suggestions:     analysis.suggestions || [],
    };

    /* -----------------------------
       SAVE DB
    ------------------------------ */

    const saved = await prisma.resume.create({

      data: {

        userId,

        fileName: sanitizeForDatabase(file.name),

        atsScore,

        strengths: resultData.strengths.map(s => sanitizeForDatabase(s)),

        improvements: resultData.weaknesses.map(s => sanitizeForDatabase(s)),

        missingKeywords: resultData.missingKeywords.map(s => sanitizeForDatabase(s)),

        parsedText: sanitizeForDatabase(resumeText),

        jobDescription: jobDescription ? sanitizeForDatabase(jobDescription) : null,

        suggestions: resultData.suggestions.map(s => sanitizeForDatabase(s)),

        // Structured data — sanitize every string field before writing to PostgreSQL
        name: sanitizeForDatabase(structuredData.name || ""),
        email: sanitizeForDatabase(structuredData.email || ""),
        phone: sanitizeForDatabase(structuredData.phone || ""),
        address: sanitizeForDatabase(structuredData.address || ""),
        linkedin: sanitizeForDatabase(structuredData.linkedin || ""),
        linkedinText: sanitizeForDatabase(structuredData.linkedinText || ""),
        github: sanitizeForDatabase(structuredData.github || ""),
        githubText: sanitizeForDatabase(structuredData.githubText || ""),
        portfolio: sanitizeForDatabase(structuredData.portfolio || ""),
        portfolioText: sanitizeForDatabase(structuredData.portfolioText || ""),
        summary: sanitizeForDatabase(structuredData.summary || ""),
        education: (structuredData.education || []).map(e => ({
          ...e,
          degree: sanitizeForDatabase(e.degree || ""),
          institution: sanitizeForDatabase(e.institution || ""),
          year: sanitizeForDatabase(e.year || ""),
        })),
        experience: (structuredData.experience || []).map(e => ({
          ...e,
          title: sanitizeForDatabase(e.title || ""),
          company: sanitizeForDatabase(e.company || ""),
          duration: sanitizeForDatabase(e.duration || ""),
          description: sanitizeForDatabase(e.description || ""),
        })),
        projects: (structuredData.projects || []).map(p => ({
          ...p,
          name: sanitizeForDatabase(p.name || ""),
          description: sanitizeForDatabase(p.description || ""),
        })),
        skills: (structuredData.skills || []).map(s => sanitizeForDatabase(s)),
        certifications: (structuredData.certifications || []).map(c => ({
          ...c,
          name: sanitizeForDatabase(c.name || ""),
          issuer: sanitizeForDatabase(c.issuer || ""),
          year: sanitizeForDatabase(c.year || ""),
        })),
        languages: (structuredData.languages || []).map(l => sanitizeForDatabase(l)),
      }
    });

    console.log("Resume saved successfully with ID:", saved.id);
    console.log("Saved structured data fields:", {
      hasName: !!saved.name,
      hasEmail: !!saved.email,
      skillsCount: saved.skills?.length || 0,
      experienceCount: saved.experience?.length || 0,
      educationCount: saved.education?.length || 0
    });

    /* -----------------------------
       RESPONSE
    ------------------------------ */

    return NextResponse.json({

      success: true,

      analysis: resultData,

      structuredData: structuredData,

      resumeId: saved.id,

      userEmail,

      fallbackUsed // Indicate whether fallback methods were used
    });

  } catch (error) {

    console.error("Analysis Error:", error);

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}