import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scripts, screenplays, scenes, projects } from "@/lib/db/schema";
import { refineScript } from "@/lib/services/gemini";
import { eq } from "drizzle-orm";
import { AppError } from "@/lib/utils/errors";
import type { CreativeScript } from "@/lib/types/script";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, projectId, customPrompt } = body as {
      scriptId: string;
      projectId: string;
      customPrompt?: string;
    };

    if (!scriptId || !projectId) {
      return NextResponse.json(
        { error: "Missing scriptId or projectId" },
        { status: 400 }
      );
    }

    // Fetch script from DB
    const scriptRow = db
      .select()
      .from(scripts)
      .where(eq(scripts.id, scriptId))
      .get();

    if (!scriptRow) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
    }

    // Fetch project for Amazon URL
    const project = db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Reconstruct CreativeScript from DB row
    const script: CreativeScript = {
      id: scriptRow.id,
      title: scriptRow.title,
      hook: scriptRow.hook,
      concept: scriptRow.concept,
      targetAudience: scriptRow.targetAudience || "",
      tone: scriptRow.tone || "",
      scenes: JSON.parse(scriptRow.sceneSummaries),
      narration: scriptRow.narration || "",
      cta: scriptRow.cta,
      estimatedDuration: scriptRow.estimatedDuration || 30,
      status: scriptRow.status as CreativeScript["status"],
    };

    // Call Gemini to refine - pass Amazon URL instead of product data
    const screenplay = await refineScript(
      script,
      project.amazonUrl,
      customPrompt
    );

    // Save screenplay to DB
    const now = new Date();
    db.insert(screenplays)
      .values({
        id: screenplay.id,
        scriptId: screenplay.scriptId,
        projectId,
        title: screenplay.title,
        totalDuration: screenplay.totalDuration,
        status: "created",
        rawJson: JSON.stringify(screenplay),
        createdAt: now,
      })
      .run();

    // Save each scene
    for (const scene of screenplay.scenes) {
      db.insert(scenes)
        .values({
          id: scene.id,
          screenplayId: screenplay.id,
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          visualDescription: scene.visualDescription,
          cameraAngle: scene.cameraAngle,
          cameraMovement: scene.cameraMovement || null,
          dialogue: scene.dialogue,
          textOverlay: scene.textOverlay || null,
          transition: scene.transition,
          duration: scene.duration,
          musicMood: scene.musicMood || null,
          soundEffects: scene.soundEffects || null,
          colorPalette: scene.colorPalette || null,
          lightingStyle: scene.lightingStyle || null,
        })
        .run();
    }

    // Update script status
    db.update(scripts)
      .set({ status: "refined" })
      .where(eq(scripts.id, scriptId))
      .run();

    // Update project status
    db.update(projects)
      .set({ status: "refined", updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .run();

    return NextResponse.json({
      scriptId,
      screenplay,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, retryable: error.retryable },
        { status: error.statusCode }
      );
    }
    console.error("Script refinement error:", error);
    return NextResponse.json(
      { error: "Failed to refine script" },
      { status: 500 }
    );
  }
}
