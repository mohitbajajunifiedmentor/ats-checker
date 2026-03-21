import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { sections } = await req.json();

    const prompt = `You are an expert resume editor and ATS specialist. Analyze the resume sections below for:
1. Spelling mistakes
2. Grammar errors (verb tense, subject-verb agreement, article misuse, etc.)
3. ATS optimization issues (missing keywords, weak action verbs, passive voice, lack of metrics)
4. Style issues (wordiness, vague phrases, inconsistent tense)

Resume sections:
${JSON.stringify(sections, null, 2)}

Return a JSON object with EXACTLY this structure:
{
  "overallScore": <0-100 integer>,
  "sections": {
    "summary":        { "score": <0-100>, "issues": [] },
    "experience":     { "score": <0-100>, "issues": [] },
    "skills":         { "score": <0-100>, "issues": [] },
    "projects":       { "score": <0-100>, "issues": [] },
    "education":      { "score": <0-100>, "issues": [] },
    "certifications": { "score": <0-100>, "issues": [] }
  }
}

Each issue must have these EXACT fields:
{
  "section":     "<section name>",
  "entryIndex":  <number or null>,
  "field":       "<field name: summary|description|name|degree|etc.>",
  "original":    "<exact substring from the resume text, or null for ATS/style issues>",
  "correction":  "<corrected text, or null>",
  "explanation": "<concise explanation, max 15 words>",
  "type":        "spelling|grammar|ats|style|keyword",
  "severity":    "high|medium|low"
}

RULES:
- "original" must be an EXACT substring from the resume text — copy it character-for-character
- Do NOT flag proper nouns, company names, technology names, job titles, or acronyms
- For summary: entryIndex must be null, field must be "summary"
- For experience/projects/education: entryIndex must match the _index field from the input
- If the same spelling/grammar error appears in multiple entries, emit a SEPARATE issue for each occurrence
- For ATS/style issues without a specific bad phrase, set original and correction to null
- Maximum 30 issues total, prioritizing high severity
- Scores: 90-100 = excellent, 70-89 = good, 50-69 = needs work, below 50 = poor
- Return ONLY valid JSON, no markdown, no explanation outside JSON`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(result.choices[0].message.content);

    // Sanitize: ensure all sections exist
    const sectionKeys = ["summary", "experience", "skills", "projects", "education", "certifications"];
    for (const key of sectionKeys) {
      if (!analysis.sections[key]) {
        analysis.sections[key] = { score: 100, issues: [] };
      }
      if (!Array.isArray(analysis.sections[key].issues)) {
        analysis.sections[key].issues = [];
      }
    }

    return NextResponse.json(analysis);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Analysis failed" }, { status: 500 });
  }
}
