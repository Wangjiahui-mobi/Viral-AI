import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createSeedanceJob } from "@/lib/services/seedance";
import { AppError } from "@/lib/utils/errors";

// In-memory store for video jobs (no DB needed for this flow)
const jobStore = new Map<
  string,
  {
    id: string;
    sceneNumber: number;
    seedanceJobId: string | null;
    status: string;
    progress: number;
    errorMessage?: string;
    videoUrl?: string;
  }[]
>();

export { jobStore };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, rawScript } = body as {
      scriptId: string;
      rawScript: string;
    };

    if (!scriptId || !rawScript) {
      return NextResponse.json(
        { error: "Missing scriptId or rawScript" },
        { status: 400 }
      );
    }

    // Send the entire script as a single video generation job
    const jobId = nanoid();
    const jobs: {
      id: string;
      sceneNumber: number;
      seedanceJobId: string | null;
      status: string;
      progress: number;
      errorMessage?: string;
      videoUrl?: string;
    }[] = [];

    try {
      const result = await createSeedanceJob({
        prompt: rawScript,
        duration: 10,
        ratio: "9:16", // 1080x1920 vertical as specified in prompt
        watermark: false,
      });

      jobs.push({
        id: jobId,
        sceneNumber: 1,
        seedanceJobId: result.jobId,
        status: "queued",
        progress: 0,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      jobs.push({
        id: jobId,
        sceneNumber: 1,
        seedanceJobId: null,
        status: "failed",
        progress: 0,
        errorMessage,
      });
    }

    jobStore.set(scriptId, jobs);

    return NextResponse.json({ scriptId, jobs });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, retryable: error.retryable },
        { status: error.statusCode }
      );
    }
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate videos" },
      { status: 500 }
    );
  }
}
