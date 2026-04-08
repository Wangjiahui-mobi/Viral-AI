import { AppError, ErrorCode } from "../utils/errors";

// Yijia Sora API
const YIJIA_API_BASE = "https://apius.yijiarj.cn";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "your_openai_api_key_here") {
    throw new AppError(
      "OPENAI_API_KEY (Sora) is not configured",
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
// Create a video generation job (yijia model)
// ==============================
export async function createVideoJob(
  prompt: string,
  model: string = "sora-2-yijia"
): Promise<{ jobId: string; status: string }> {
  const response = await fetch(`${YIJIA_API_BASE}/v1/videos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      model,
      size: getApiKey(), // yijia API uses size field for API key
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage =
      (errorBody as { error?: { message?: string }; message?: string }).error
        ?.message ||
      (errorBody as { message?: string }).message ||
      `Sora API error: ${response.status}`;

    if (response.status === 429) {
      throw new AppError(
        "Sora rate limit exceeded",
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

  const data = (await response.json()) as {
    id: string;
    status: string;
    model: string;
    progress: number;
  };

  console.log("[Sora] Job created:", data.id, "model:", data.model);

  return {
    jobId: data.id,
    status: data.status || "queued",
  };
}

// ==============================
// Check video generation status (yijia shared endpoint)
// ==============================
export async function getVideoStatus(
  jobId: string
): Promise<{
  status: string;
  progress?: number;
  error?: string;
  videoUrl?: string;
}> {
  // Yijia uses GET /v1/videos/{id} for status polling
  const response = await fetch(`${YIJIA_API_BASE}/v1/videos/${jobId}`, {
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
    id: string;
    status: string;
    progress?: number;
    error?: { message?: string };
    url?: string;
    output?: { url?: string };
    data?: { url?: string }[];
    video_url?: string;
    result_url?: string;
  };

  console.log("[Sora] Status:", data.status, "Progress:", data.progress, "URL:", data.url);

  // Extract video URL from possible response structures
  let videoUrl: string | undefined;
  if (data.url) {
    videoUrl = data.url;
  } else if (data.video_url) {
    videoUrl = data.video_url;
  } else if (data.result_url) {
    videoUrl = data.result_url;
  } else if (data.data && data.data.length > 0) {
    videoUrl = data.data[0].url;
  } else if (data.output?.url) {
    videoUrl = data.output.url;
  }

  // Normalize status
  let normalizedStatus = data.status || "unknown";
  if (normalizedStatus === "succeeded" || normalizedStatus === "complete") {
    normalizedStatus = "completed";
  }

  return {
    status: normalizedStatus,
    progress: data.progress,
    error: data.error?.message,
    videoUrl,
  };
}
