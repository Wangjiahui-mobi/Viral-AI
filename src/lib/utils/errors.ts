export enum ErrorCode {
  // Product errors
  INVALID_AMAZON_URL = "INVALID_AMAZON_URL",
  PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND",
  RAINFOREST_API_ERROR = "RAINFOREST_API_ERROR",

  // Gemini errors
  GEMINI_API_ERROR = "GEMINI_API_ERROR",
  GEMINI_RATE_LIMIT = "GEMINI_RATE_LIMIT",
  GEMINI_INVALID_RESPONSE = "GEMINI_INVALID_RESPONSE",
  GEMINI_SAFETY_BLOCK = "GEMINI_SAFETY_BLOCK",

  // Sora errors
  SORA_API_ERROR = "SORA_API_ERROR",
  SORA_RATE_LIMIT = "SORA_RATE_LIMIT",
  SORA_CONTENT_POLICY = "SORA_CONTENT_POLICY",
  SORA_JOB_FAILED = "SORA_JOB_FAILED",

  // General
  DATABASE_ERROR = "DATABASE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}
