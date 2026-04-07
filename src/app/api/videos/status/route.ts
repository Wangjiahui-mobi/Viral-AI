import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { videoJobs, screenplays } from "@/lib/db/schema";
import { getVideoStatus } from "@/lib/services/sora";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const screenplayId = searchParams.get("screenplayId");

    if (!screenplayId) {
      return NextResponse.json(
        { error: "Missing screenplayId parameter" },
        { status: 400 }
      );
    }

    // Fetch all video jobs for this screenplay
    const jobs = db
      .select()
      .from(videoJobs)
      .where(eq(videoJobs.screenplayId, screenplayId))
      .all();

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "No video jobs found for this screenplay" },
        { status: 404 }
      );
    }

    // Check status of incomplete jobs with Sora API
    for (const job of jobs) {
      if (
        job.soraJobId &&
        job.status !== "completed" &&
        job.status !== "failed"
      ) {
        try {
          const soraStatus = await getVideoStatus(job.soraJobId);

          const newStatus =
            soraStatus.status === "completed"
              ? "completed"
              : soraStatus.status === "failed"
                ? "failed"
                : soraStatus.status === "in_progress"
                  ? "in_progress"
                  : "queued";

          db.update(videoJobs)
            .set({
              status: newStatus,
              progress: soraStatus.progress || job.progress,
              errorMessage: soraStatus.error || job.errorMessage,
              videoUrl: soraStatus.videoUrl || job.videoUrl,
              completedAt:
                newStatus === "completed" ? new Date() : job.completedAt,
            })
            .where(eq(videoJobs.id, job.id))
            .run();

          // Update local object for response
          job.status = newStatus;
          job.progress = soraStatus.progress ?? job.progress;
          job.errorMessage = soraStatus.error || job.errorMessage;
          job.videoUrl = soraStatus.videoUrl || job.videoUrl;
        } catch {
          // If status check fails, keep existing status
          console.error(`Failed to check status for job ${job.id}`);
        }
      }
    }

    const allCompleted = jobs.every(
      (j) => j.status === "completed" || j.status === "failed"
    );

    // Update screenplay status if all done
    if (allCompleted) {
      const allSuccessful = jobs.every((j) => j.status === "completed");
      db.update(screenplays)
        .set({ status: allSuccessful ? "completed" : "failed" })
        .where(eq(screenplays.id, screenplayId))
        .run();
    }

    return NextResponse.json({
      screenplayId,
      allCompleted,
      jobs: jobs.map((j) => ({
        id: j.id,
        sceneId: j.sceneId,
        screenplayId: j.screenplayId,
        soraJobId: j.soraJobId,
        status: j.status,
        progress: j.progress || 0,
        errorMessage: j.errorMessage,
        videoUrl: j.videoUrl,
        createdAt: j.createdAt,
        completedAt: j.completedAt,
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
