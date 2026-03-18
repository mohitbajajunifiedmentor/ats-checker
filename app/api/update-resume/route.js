// app/api/update-resume/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/auth";

export async function POST(req) {
  try {
    const { resumeId, structuredData } = await req.json();

    if (!resumeId || !structuredData) {
      return NextResponse.json(
        { error: "Resume ID and structured data are required" },
        { status: 400 }
      );
    }

    // Update the resume with new structured data
    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        name: structuredData.name,
        email: structuredData.email,
        phone: structuredData.phone,
        address: structuredData.address,
        linkedin: structuredData.linkedin,
        github: structuredData.github,
        portfolio: structuredData.portfolio,
        summary: structuredData.summary,
        education: structuredData.education,
        experience: structuredData.experience,
        projects: structuredData.projects,
        skills: structuredData.skills || [],
        certifications: structuredData.certifications,
        languages: structuredData.languages || []
      }
    });

    return NextResponse.json({
      success: true,
      message: "Resume data updated successfully",
      resume: updatedResume
    });

  } catch (error) {
    console.error("Update Resume Error:", error);
    return NextResponse.json(
      { error: "Failed to update resume data" },
      { status: 500 }
    );
  }
}