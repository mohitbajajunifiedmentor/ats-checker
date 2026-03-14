// app/api/history/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/auth";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      // No email → no user context → return empty history
      return NextResponse.json([]);
    }

    const history = await prisma.resume.findMany({
      where: { user: { email: email.toLowerCase() } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}