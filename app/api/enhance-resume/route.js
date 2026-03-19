export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { resumeData, jobDescription, resumeId } = await req.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: "Resume data and job description are required" },
        { status: 400 }
      );
    }

    const resumeText = formatResumeText(resumeData);

    /* ── Build the AI prompt ──────────────────────────────────────
       Explicitly lists every field so the model cannot skip any.
       CRITICAL: projects, certifications, languages must all be kept.
    ─────────────────────────────────────────────────────────────── */
    const prompt = `You are an expert ATS resume writer.

TASK: Enhance the resume below to better match the job description.
RULES:
- Keep ALL personal data exactly as-is: name, email, phone, address, linkedin, linkedinText, github, githubText, portfolio, portfolioText.
- Preserve ALL sections: experience, education, projects, certifications, languages.
- Do NOT remove or omit any section, project, or experience entry.
- Improve summary, experience descriptions, and skills for ATS keyword matching.
- Add missing keywords from the job description naturally into descriptions.
- Use strong action verbs and quantifiable achievements.
- Keep project count = ${(resumeData.projects || []).length} (must preserve all ${(resumeData.projects || []).length} projects).
- Keep experience count = ${(resumeData.experience || []).length} (must preserve all ${(resumeData.experience || []).length} roles).

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "name": "${resumeData.name || ""}",
  "email": "${resumeData.email || ""}",
  "phone": "${resumeData.phone || ""}",
  "address": "${resumeData.address || ""}",
  "linkedin": "${resumeData.linkedin || ""}",
  "linkedinText": "${resumeData.linkedinText || ""}",
  "github": "${resumeData.github || ""}",
  "githubText": "${resumeData.githubText || ""}",
  "portfolio": "${resumeData.portfolio || ""}",
  "portfolioText": "${resumeData.portfolioText || ""}",
  "headline": "${resumeData.headline || resumeData.experience?.[0]?.title || ""}",
  "summary": "Enhanced 50-80 word summary with job-relevant keywords",
  "skills": ["skill1", "skill2", "... include all original skills plus relevant missing ones"],
  "experience": [
    {
      "title": "exact original title",
      "company": "exact original company",
      "duration": "exact original duration",
      "description": "Enhanced bullet points with action verbs and metrics"
    }
  ],
  "education": [
    {
      "degree": "exact original degree",
      "institution": "exact original institution",
      "year": "exact original year",
      "gpa": null
    }
  ],
  "projects": [
    {
      "name": "exact original project name",
      "description": "Enhanced description with technologies and impact",
      "technologies": ["tech1", "tech2"],
      "githubRepo": "exact original github repo URL or null",
      "liveLink": "exact original live demo URL or null"
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuer",
      "year": "year"
    }
  ],
  "languages": ["language1"],
  "enhancements": [
    "Specific enhancement 1 (e.g., Added React keyword to experience section)",
    "Specific enhancement 2",
    "Specific enhancement 3"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Return valid JSON only. Never omit any section or data field from the original resume."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 4000,
    });

    let enhancedContent;
    try {
      const raw = response.choices[0].message.content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      enhancedContent = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (parseErr) {
      console.error("JSON parse error in enhance-resume:", parseErr.message);
      // Fall back to original data — no data will be lost
      enhancedContent = {};
    }

    /* ── Merge: original data is the base, AI enhancements override ──
       This guarantees no field (especially projects) is accidentally dropped
       even if the AI truncates or omits a section.
    ─────────────────────────────────────────────────────────────── */
    const merged = {
      // Personal info: always keep original
      name:        resumeData.name        || enhancedContent.name        || "",
      email:       resumeData.email       || enhancedContent.email       || "",
      phone:       resumeData.phone       || enhancedContent.phone       || "",
      address:     resumeData.address     || enhancedContent.address     || "",
      linkedin:      resumeData.linkedin      || enhancedContent.linkedin    || "",
      linkedinText:  resumeData.linkedinText  || "",
      github:        resumeData.github        || enhancedContent.github      || "",
      githubText:    resumeData.githubText    || "",
      portfolio:     resumeData.portfolio     || enhancedContent.portfolio   || "",
      portfolioText: resumeData.portfolioText || "",
      headline:    enhancedContent.headline  || resumeData.headline  || resumeData.experience?.[0]?.title || "",

      // AI-enhanced content (fall back to original)
      summary:     enhancedContent.summary     || resumeData.summary     || "",
      skills:      (enhancedContent.skills?.length ? enhancedContent.skills : null)      || resumeData.skills      || [],

      // For arrays: if AI returned fewer items than original, use original (preserve all entries)
      experience: mergeArray(
        resumeData.experience || [],
        enhancedContent.experience || [],
        (orig, enh) => ({ ...orig, description: enh?.description || orig.description })
      ),
      education: mergeArray(
        resumeData.education || [],
        enhancedContent.education || [],
        (orig, enh) => ({ ...orig, ...enh, degree: orig.degree, institution: orig.institution, year: orig.year })
      ),
      projects: mergeArray(
        resumeData.projects || [],
        enhancedContent.projects || [],
        (orig, enh) => ({
          ...orig,
          description: enh?.description || orig.description,
          technologies: (enh?.technologies?.length ? enh.technologies : null) || orig.technologies || [],
          githubRepo: orig.githubRepo || enh?.githubRepo || null,
          liveLink:   orig.liveLink   || enh?.liveLink   || null,
        })
      ),
      certifications: (enhancedContent.certifications?.length ? enhancedContent.certifications : null) || resumeData.certifications || [],
      languages:      (enhancedContent.languages?.length ? enhancedContent.languages : null)      || resumeData.languages      || [],

      enhancements: enhancedContent.enhancements || [
        "Optimized keywords to match job description",
        "Strengthened action verbs in experience section",
        "Expanded professional summary with role-relevant terms",
        "Aligned skills with job requirements",
      ],
    };

    return NextResponse.json({
      success: true,
      enhanced: {
        ...merged,
        resumeId: resumeId || "temp-" + Date.now(),
      },
    });

  } catch (error) {
    console.error("Enhanced Resume Error:", error);
    return NextResponse.json(
      { error: "Failed to enhance resume", details: error.message },
      { status: 500 }
    );
  }
}

/* ── Merge original array with AI-enhanced array ──────────────────
   If AI returned fewer items than original, original items are kept.
   Each item is merged using the provided merge function.
─────────────────────────────────────────────────────────────────── */
function mergeArray(original, enhanced, mergeFn) {
  if (!original.length) return enhanced.length ? enhanced : [];
  return original.map((origItem, i) => {
    const enhItem = enhanced[i] || null;
    return enhItem ? mergeFn(origItem, enhItem) : origItem;
  });
}

function formatResumeText(data) {
  if (typeof data === "string") return data;
  let text = "";
  if (data.name)    text += `Name: ${data.name}\n`;
  if (data.email)   text += `Email: ${data.email}\n`;
  if (data.phone)   text += `Phone: ${data.phone}\n`;
  if (data.address) text += `Address: ${data.address}\n\n`;
  if (data.summary) text += `Summary:\n${data.summary}\n\n`;
  if (data.skills?.length) text += `Skills: ${data.skills.join(", ")}\n\n`;
  if (data.experience?.length) {
    text += "Experience:\n";
    data.experience.forEach(e => {
      text += `${e.title} at ${e.company} (${e.duration})\n${e.description || ""}\n\n`;
    });
  }
  if (data.projects?.length) {
    text += "Projects:\n";
    data.projects.forEach(p => {
      text += `${p.name}: ${p.description || ""}\n`;
      if (p.technologies?.length) text += `  Technologies: ${p.technologies.join(", ")}\n`;
      if (p.githubRepo) text += `  GitHub: ${p.githubRepo}\n`;
      if (p.liveLink)   text += `  Live: ${p.liveLink}\n`;
    });
    text += "\n";
  }
  if (data.education?.length) {
    text += "Education:\n";
    data.education.forEach(e => {
      text += `${e.degree} - ${e.institution} (${e.year})\n`;
    });
    text += "\n";
  }
  if (data.certifications?.length) {
    text += "Certifications:\n";
    data.certifications.forEach(c => { text += `${c.name} - ${c.issuer} (${c.year})\n`; });
    text += "\n";
  }
  if (data.languages?.length) text += `Languages: ${data.languages.join(", ")}\n`;
  return text;
}
