import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { scripts, projects } from "@/lib/db/schema";
import { generateCreativeScripts } from "@/lib/services/gemini";
import { AppError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amazonUrl, customPrompt } = body as {
      amazonUrl: string;
      customPrompt?: string;
    };

    if (!amazonUrl || typeof amazonUrl !== "string") {
      return NextResponse.json(
        { error: "Missing Amazon URL" },
        { status: 400 }
      );
    }

    // Create project
    const projectId = nanoid();
    const now = new Date();

    db.insert(projects)
      .values({
        id: projectId,
        amazonUrl,
        asin: "",
        productData: "{}",
        status: "created",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // Call Gemini directly with the Amazon URL
    const generatedScripts = await generateCreativeScripts(
      amazonUrl,
      customPrompt
    );

    // Save scripts to database
    for (const script of generatedScripts) {
      db.insert(scripts)
        .values({
          id: script.id,
          projectId,
          title: script.title,
          hook: script.hook,
          concept: script.concept,
          targetAudience: script.targetAudience,
          tone: script.tone,
          sceneSummaries: JSON.stringify(script.scenes),
          narration: script.narration,
          cta: script.cta,
          estimatedDuration: script.estimatedDuration,
          status: "generated",
          rawJson: JSON.stringify(script),
          createdAt: now,
        })
        .run();
    }

    // Update project status
    db.update(projects)
      .set({ status: "scripts_generated", updatedAt: new Date() })
      .where(
        (await import("drizzle-orm")).eq(projects.id, projectId)
      )
      .run();

    return NextResponse.json({
      projectId,
      scripts: generatedScripts,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code, retryable: error.retryable },
        { status: error.statusCode }
      );
    }
    console.error("Script generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate scripts" },
      { status: 500 }
    );
  }
}
