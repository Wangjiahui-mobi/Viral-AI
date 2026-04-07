import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  scenes as scenesTable,
  screenplays,
  videoJobs,
} from "@/lib/db/schema";
import { createVideoJob } from "@/lib/services/sora";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screenplayId } = body as { screenplayId: string };

    if (!screenplayId) {
      return NextResponse.json(
        { error: "Missing screenplayId" },
        { status: 400 }
      );
    }

    // Fetch screenplay
    const screenplay = db
      .select()
      .from(screenplays)
      .where(eq(screenplays.id, screenplayId))
      .get();

    if (!screenplay) {
      return NextResponse.json(
        { error: "Screenplay not found" },
        { status: 404 }
      );
    }

    // Fetch all scenes
    const scenesList = db
      .select()
      .from(scenesTable)
      .where(eq(scenesTable.screenplayId, screenplayId))
      .all();

    if (scenesList.length === 0) {
      return NextResponse.json(
        { error: "No scenes found for this screenplay" },
        { status: 404 }
      );
    }

    const now = new Date();
    const jobs: { sceneId: string; videoJobId: string; status: string }[] = [];

    // Create a video job for each scene
    for (const scene of scenesList) {
      const jobId = nanoid();

      try {
        const soraResult = await createVideoJob(
          scene.visualDescription,
          scene.duration
        );

        db.insert(videoJobs)
          .values({
            id: jobId,
            sceneId: scene.id,
            screenplayId,
            soraJobId: soraResult.jobId,
            status: soraResult.status === "completed" ? "completed" : "queued",
            progress: 0,
            createdAt: now,
          })
          .run();

        jobs.push({
          sceneId: scene.id,
          videoJobId: jobId,
          status: soraResult.status,
        });
      } catch (error) {
        // If one scene fails, record the error but continue with others
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        db.insert(videoJobs)
          .values({
            id: jobId,
            sceneId: scene.id,
            screenplayId,
            soraJobId: null,
            status: "failed",
            progress: 0,
            errorMessage,
            createdAt: now,
          })
          .run();

        jobs.push({
          sceneId: scene.id,
          videoJobId: jobId,
          status: "failed",
        });
      }
    }

    // Update screenplay status
    db.update(screenplays)
      .set({ status: "video_generating" })
      .where(eq(screenplays.id, screenplayId))
      .run();

    return NextResponse.json({
      screenplayId,
      jobs,
    });
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
