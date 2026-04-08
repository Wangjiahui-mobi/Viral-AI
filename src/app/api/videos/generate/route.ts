import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createVideoJob } from "@/lib/services/sora";
import { AppError } from "@/lib/utils/errors";

// In-memory store for video jobs
const jobStore = new Map<
  string,
  {
    id: string;
    sceneNumber: number;
    soraJobId: string | null;
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

    // Send the entire script as a single video generation job via Sora yijia
    const jobId = nanoid();
    const jobs: {
      id: string;
      sceneNumber: number;
      soraJobId: string | null;
      status: string;
      progress: number;
      errorMessage?: string;
      videoUrl?: string;
    }[] = [];

    try {
      const result = await createVideoJob(rawScript);

      jobs.push({
        id: jobId,
        sceneNumber: 1,
        soraJobId: result.jobId,
        status: result.status,
        progress: 0,
      });

      console.log("[Generate] Sora job created:", result.jobId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[Generate] Sora job failed:", errorMessage);
      jobs.push({
        id: jobId,
        sceneNumber: 1,
        soraJobId: null,
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
