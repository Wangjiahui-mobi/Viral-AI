import { NextResponse } from "next/server";
import { createSeedanceJob } from "@/lib/services/seedance";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt: string;
      ratio?: string;
      duration?: number;
      watermark?: boolean;
      imageUrl?: string;
    };

    if (!body.prompt || body.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await createSeedanceJob({
      prompt: body.prompt.trim(),
      ratio: body.ratio,
      duration: body.duration,
      watermark: body.watermark,
      imageUrl: body.imageUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate video";
    const status = (error as { statusCode?: number }).statusCode || 500;
    return NextResponse.json({ error: message }, { status });
  }
}
