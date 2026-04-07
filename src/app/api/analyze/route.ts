import { NextRequest, NextResponse } from "next/server";
import { analyzeVideoAndGenerateScript } from "@/lib/services/gemini";
import { AppError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, customPrompt } = body as {
      videoUrl: string;
      customPrompt?: string;
    };

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { error: "Missing video URL" },
        { status: 400 }
      );
    }

    const script = await analyzeVideoAndGenerateScript(videoUrl, customPrompt);

    return NextResponse.json({ script });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, retryable: error.retryable },
        { status: error.statusCode }
      );
    }
    console.error("Video analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze video" },
      { status: 500 }
    );
  }
}
