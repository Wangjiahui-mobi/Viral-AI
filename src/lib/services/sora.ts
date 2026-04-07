import { AppError, ErrorCode } from "../utils/errors";

const OPENAI_API_BASE = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "your_openai_api_key_here") {
    throw new AppError(
      "OPENAI_API_KEY is not configured",
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

// ==============================
// Create a video generation job
// ==============================
export async function createVideoJob(
  prompt: string,
  durationSeconds: number,
  size: string = "1280x720"
): Promise<{ jobId: string; status: string }> {
  // Clamp duration to Sora limits (5-20 seconds)
  const clampedDuration = Math.max(5, Math.min(20, durationSeconds));

  const response = await fetch(`${OPENAI_API_BASE}/videos/generations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.SORA_MODEL || "sora",
      prompt,
      size,
      n: 1,
      duration: clampedDuration,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage =
      (errorBody as { error?: { message?: string } }).error?.message ||
      `Sora API error: ${response.status}`;

    if (response.status === 429) {
      throw new AppError(
        "Sora rate limit exceeded",
        ErrorCode.SORA_RATE_LIMIT,
        429,
        true
      );
    }

    throw new AppError(errorMessage, ErrorCode.SORA_API_ERROR, response.status, true);
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
export async function getVideoStatus(
  jobId: string
): Promise<{
  status: string;
  progress?: number;
  error?: string;
  videoUrl?: string;
}> {
  const response = await fetch(`${OPENAI_API_BASE}/videos/generations/${jobId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new AppError(
      `Failed to get video status: ${response.status}`,
      ErrorCode.SORA_API_ERROR,
      response.status,
      true
    );
  }

  const data = (await response.json()) as {
    status: string;
    progress?: number;
    error?: { message?: string };
    output?: { url?: string };
    data?: { url?: string }[];
  };

  // Extract video URL from possible response structures
  let videoUrl: string | undefined;
  if (data.data && data.data.length > 0) {
    videoUrl = data.data[0].url;
  } else if (data.output?.url) {
    videoUrl = data.output.url;
  }

  return {
    status: data.status || "unknown",
    progress: data.progress,
    error: data.error?.message,
    videoUrl,
  };
}

// ==============================
// Download generated video
// ==============================
export async function downloadVideo(
  videoUrl: string
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(videoUrl, {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
  });

  if (!response.ok || !response.body) {
    throw new AppError(
      `Failed to download video: ${response.status}`,
      ErrorCode.SORA_API_ERROR,
      response.status,
      true
    );
  }

  return response.body;
}
