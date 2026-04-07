"use client";

import { useState, useRef, useCallback } from "react";

type JobStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "processing"
  | "succeeded"
  | "failed";

export default function SeedanceTestPage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [watermark, setWatermark] = useState(false);

  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    (id: string) => {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/seedance/status?jobId=${id}`);
          const data = (await res.json()) as {
            status: string;
            videoUrl?: string;
            error?: string;
          };

          setRawResponse(JSON.stringify(data, null, 2));

          if (!res.ok) {
            setError(data.error || "Failed to check status");
            setJobStatus("failed");
            stopPolling();
            return;
          }

          if (data.status === "succeeded" && data.videoUrl) {
            setVideoUrl(data.videoUrl);
            setJobStatus("succeeded");
            stopPolling();
          } else if (data.status === "failed") {
            setError(data.error || "Video generation failed");
            setJobStatus("failed");
            stopPolling();
          } else {
            setJobStatus("processing");
          }
        } catch {
          setError("Network error while checking status");
          setJobStatus("failed");
          stopPolling();
        }
      }, 10000); // poll every 10 seconds
    },
    [stopPolling]
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setJobStatus("submitting");
    setError(null);
    setVideoUrl(null);
    setJobId(null);
    setRawResponse(null);
    stopPolling();

    try {
      const res = await fetch("/api/seedance/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ratio,
          duration,
          watermark,
        }),
      });

      const data = (await res.json()) as {
        jobId?: string;
        status?: string;
        error?: string;
      };

      setRawResponse(JSON.stringify(data, null, 2));

      if (!res.ok) {
        setError(data.error || "Failed to submit job");
        setJobStatus("failed");
        return;
      }

      setJobId(data.jobId || null);
      setJobStatus("queued");
      if (data.jobId) {
        pollStatus(data.jobId);
      }
    } catch {
      setError("Network error");
      setJobStatus("failed");
    }
  };

  const handleReset = () => {
    stopPolling();
    setJobStatus("idle");
    setJobId(null);
    setVideoUrl(null);
    setError(null);
    setRawResponse(null);
  };

  const isGenerating =
    jobStatus === "submitting" ||
    jobStatus === "queued" ||
    jobStatus === "processing";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Seedance API Test</h1>
            <p className="text-sm text-muted mt-0.5">
              Doubao Seed 2.0 Video Generation
            </p>
          </div>
          <a
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            &larr; Back
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想生成的视频内容..."
              rows={4}
              disabled={isGenerating}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm
                         placeholder:text-muted resize-none
                         focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            />
            <p className="text-xs text-muted">{prompt.length} characters</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Ratio */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Aspect Ratio
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent/50
                           disabled:opacity-50"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Duration (seconds)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={isGenerating}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent/50
                           disabled:opacity-50"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
              </select>
            </div>

            {/* Watermark */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Watermark
              </label>
              <div className="flex items-center h-[38px]">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watermark}
                    onChange={(e) => setWatermark(e.target.checked)}
                    disabled={isGenerating}
                    className="accent-accent w-4 h-4"
                  />
                  <span>{watermark ? "On" : "Off"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium
                         rounded-lg px-6 py-3 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {jobStatus === "submitting"
                ? "Submitting..."
                : jobStatus === "queued"
                  ? "Queued..."
                  : jobStatus === "processing"
                    ? "Generating..."
                    : "Generate Video"}
            </button>

            {(isGenerating ||
              jobStatus === "succeeded" ||
              jobStatus === "failed") && (
              <button
                onClick={handleReset}
                className="bg-card hover:bg-card-hover border border-border
                           rounded-lg px-4 py-3 text-sm text-muted hover:text-foreground
                           transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Job ID */}
          {jobId && (
            <div className="bg-card border border-border rounded-lg px-4 py-3 text-xs font-mono text-muted">
              Task ID: {jobId}
            </div>
          )}

          {/* Status indicator */}
          {isGenerating && (
            <div className="flex items-center gap-3 text-sm text-muted">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>
                {jobStatus === "queued"
                  ? "Task queued, waiting to start..."
                  : "Generating video, polling every 10s..."}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-lg px-4 py-3 text-sm text-error animate-fade-in">
              {error}
            </div>
          )}

          {/* Video Result */}
          {videoUrl && (
            <div className="animate-fade-in space-y-3">
              <h2 className="text-sm font-medium">Result</h2>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <video src={videoUrl} controls autoPlay className="w-full" />
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Open video in new tab &rarr;
              </a>
            </div>
          )}

          {/* Debug: Raw API Response */}
          {rawResponse && (
            <details className="group">
              <summary className="text-xs text-muted cursor-pointer hover:text-foreground transition-colors">
                Debug: Raw API Response
              </summary>
              <pre className="mt-2 bg-card border border-border rounded-lg px-4 py-3 text-xs font-mono text-muted overflow-x-auto">
                {rawResponse}
              </pre>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}
