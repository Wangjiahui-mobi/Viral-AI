import { NextRequest, NextResponse } from "next/server";
import { getSeedanceStatus } from "@/lib/services/seedance";
import { jobStore } from "../generate/route";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get("scriptId");

    if (!scriptId) {
      return NextResponse.json(
        { error: "Missing scriptId parameter" },
        { status: 400 }
      );
    }

    const jobs = jobStore.get(scriptId);

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: "No video jobs found" },
        { status: 404 }
      );
    }

    // Check status of incomplete jobs
    for (const job of jobs) {
      if (
        job.seedanceJobId &&
        job.status !== "completed" &&
        job.status !== "failed"
      ) {
        try {
          const status = await getSeedanceStatus(job.seedanceJobId);

          if (status.status === "succeeded" || status.status === "completed") {
            job.status = "completed";
            job.progress = 100;
            job.videoUrl = status.videoUrl;
          } else if (status.status === "failed") {
            job.status = "failed";
            job.errorMessage = status.error;
          } else {
            job.status = "in_progress";
            job.progress = status.progress || 50;
          }
        } catch {
          // Keep existing status on transient errors
        }
      }
    }

    const allCompleted = jobs.every(
      (j) => j.status === "completed" || j.status === "failed"
    );

    return NextResponse.json({
      scriptId,
      allCompleted,
      jobs: jobs.map((j) => ({
        id: j.id,
        sceneId: `scene-${j.sceneNumber}`,
        screenplayId: scriptId,
        soraJobId: j.seedanceJobId,
        status: j.status,
        progress: j.progress,
        errorMessage: j.errorMessage,
        videoUrl: j.videoUrl,
        createdAt: new Date(),
      })),
    });
  } catch (error) {
    console.error("Video status check error:", error);
    return NextResponse.json(
      { error: "Failed to check video status" },
      { status: 500 }
    );
  }
}
