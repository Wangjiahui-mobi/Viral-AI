import { AppError, ErrorCode } from "../utils/errors";

// Volcengine Ark API for Doubao Seed video generation
const ARK_API_BASE =
  process.env.ARK_API_BASE || "https://ark.cn-beijing.volces.com/api/v3";

function getApiKey(): string {
  const key = process.env.ARK_API_KEY;
  if (!key) {
    throw new AppError(
      "ARK_API_KEY is not configured",
      ErrorCode.SORA_API_ERROR,
      500
    );
  }
  return key;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface SeedanceGenerateParams {
  prompt: string;
  ratio?: string; // e.g. "16:9", "9:16", "1:1"
  duration?: number; // seconds, e.g. 5, 10
  watermark?: boolean;
  imageUrl?: string; // for image-to-video mode
}

// ==============================
// Create a video generation task
// ==============================
export async function createSeedanceJob(
  params: SeedanceGenerateParams
): Promise<{ jobId: string; status: string }> {
  const content: Record<string, unknown>[] = [];

  // If imageUrl is provided, add it as first_frame for image-to-video
  if (params.imageUrl) {
    content.push({
      type: "image_url",
      image_url: params.imageUrl,
    });
  }

  content.push({
    type: "text",
    text: params.prompt,
  });

  const body: Record<string, unknown> = {
    model: process.env.SEEDANCE_MODEL || "doubao-seedance-1-0-lite-t2v-250428",
    content,
  };

  if (params.ratio) body.ratio = params.ratio;
  if (params.duration) body.duration = params.duration;
  if (params.watermark !== undefined) body.watermark = params.watermark;

  const response = await fetch(
    `${ARK_API_BASE}/contents/generations/tasks`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Ark API error: ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody) as {
        error?: { message?: string };
        message?: string;
      };
      errorMessage =
        parsed.error?.message || parsed.message || errorMessage;
    } catch {
      errorMessage = errorBody || errorMessage;
    }

    if (response.status === 429) {
      throw new AppError(
        "Rate limit exceeded",
        ErrorCode.SORA_RATE_LIMIT,
        429,
        true
      );
    }

    throw new AppError(
      errorMessage,
      ErrorCode.SORA_API_ERROR,
      response.status,
      true
    );
  }

  const data = (await response.json()) as { id: string; status: string };

  return {
    jobId: data.id,
    status: data.status || "queued",
  };
}

// ==============================
// Check video generation status
// ==============================
export async function getSeedanceStatus(jobId: string): Promise<{
  status: string;
  progress?: number;
  error?: string;
  videoUrl?: string;
}> {
  const response = await fetch(
    `${ARK_API_BASE}/contents/generations/tasks/${jobId}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `Failed to get task status: ${errorBody || response.status}`,
      ErrorCode.SORA_API_ERROR,
      response.status,
      true
    );
  }

  const data = (await response.json()) as {
    id: string;
    status: string;
    content?: { video_url?: string };
    error?: { message?: string; code?: string };
  };

  let videoUrl: string | undefined;
  if (data.content?.video_url) {
    videoUrl = data.content.video_url;
  }

  return {
    status: data.status,
    error: data.error?.message,
    videoUrl,
  };
}
