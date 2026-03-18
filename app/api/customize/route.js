export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/app/lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {

  try {

    const { resumeId, jobDescription, templateType = "professional" } = await req.json();

    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { error: "Resume ID and job description are required" },
        { status: 400 }
      );
    }

    // Fetch the original resume data
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Generate customized resume content
    const customizePrompt = `
You are an expert resume writer. Customize the resume content to better match the job description.

Original Resume Data:
${JSON.stringify({
  name: resume.name,
  email: resume.email,
  phone: resume.phone,
  address: resume.address,
  linkedin: resume.linkedin,
  github: resume.github,
  portfolio: resume.portfolio,
  summary: resume.summary,
  education: resume.education,
  experience: resume.experience,
  projects: resume.projects,
  skills: resume.skills,
  certifications: resume.certifications,
  languages: resume.languages
}, null, 2)}

Job Description:
${jobDescription}

Template Type: ${templateType}

Instructions:
1. Rewrite the summary to highlight relevant experience and skills for this job
2. Adjust experience descriptions to emphasize keywords and achievements that match the job requirements
3. Modify project descriptions to showcase relevant technologies and outcomes
4. Reorder skills to prioritize those mentioned in the job description
5. Keep all factual information accurate
6. Make the content more ATS-friendly by incorporating job-specific keywords naturally
7. Return the customized resume data in the same JSON structure

Return ONLY valid JSON with the customized resume data.
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: customizePrompt.length > 15000 ? customizePrompt.substring(0, 15000) + "..." : customizePrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    let response = result.choices[0].message.content;
    response = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let customizedData;
    try {
      customizedData = JSON.parse(response);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Generate the full resume text in the specified template format
    const templatePrompt = `
Create a professional resume text based on the customized data below.

Resume Data:
${JSON.stringify(customizedData, null, 2)}

Template Type: ${templateType}

Instructions:
- Create a well-formatted resume text
- Use professional language
- Include all relevant sections
- Make it ATS-friendly
- Keep it concise but comprehensive
- Format it as plain text that can be copied into a document

Return the complete resume text.
`;

    const templateResult = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: templatePrompt.length > 10000 ? templatePrompt.substring(0, 10000) + "..." : templatePrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    let customizedResumeText = templateResult.choices[0].message.content.trim();

    // Calculate new ATS score for the customized resume
    const keywordAnalysis = keywordDiff({
      resumeText: customizedResumeText,
      jobDescription
    });

    const newAtsScore = computeAtsScore({
      matchedKeywords: keywordAnalysis.matchedKeywords,
      jobKeywords: keywordAnalysis.jobKeywords
    });

    // Save the customized version
    const customizedResume = await prisma.resume.create({
      data: {
        userId: resume.userId,
        fileName: `${resume.fileName.replace('.pdf', '')}_customized.pdf`,
        atsScore: newAtsScore,
        strengths: [], // Could add analysis here
        improvements: [],
        missingKeywords: keywordAnalysis.missingKeywords,
        parsedText: customizedResumeText,
        jobDescription,
        suggestions: [],
        // Include customized structured data
        name: customizedData.name,
        email: customizedData.email,
        phone: customizedData.phone,
        address: customizedData.address,
        linkedin: customizedData.linkedin,
        github: customizedData.github,
        portfolio: customizedData.portfolio,
        summary: customizedData.summary,
        education: customizedData.education,
        experience: customizedData.experience,
        projects: customizedData.projects,
        skills: customizedData.skills,
        certifications: customizedData.certifications,
        languages: customizedData.languages
      }
    });

    return NextResponse.json({
      success: true,
      customizedResume: {
        id: customizedResume.id,
        atsScore: newAtsScore,
        improvement: newAtsScore - resume.atsScore,
        customizedText: customizedResumeText,
        matchedKeywords: keywordAnalysis.matchedKeywords,
        missingKeywords: keywordAnalysis.missingKeywords
      }
    });

  } catch (error) {

    console.error("Customization Error:", error);

    return NextResponse.json(
      { error: "Customization failed" },
      { status: 500 }
    );
  }
}

/* -----------------------------
   KEYWORD EXTRACTION (same as analyze)
------------------------------ */

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
  "i", "if", "in", "into", "is", "it", "its", "of", "on", "or", "our", "such", "that",
  "the", "their", "then", "there", "these", "they", "this", "to", "was", "we",
  "were", "will", "with", "you", "your"
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

function computeAtsScore({ matchedKeywords, jobKeywords }) {
  const total = jobKeywords.length;

  if (!total) return 70;

  const score = (matchedKeywords.length / total) * 100;

  return Math.round(score);
}