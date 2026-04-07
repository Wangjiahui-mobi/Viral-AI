"use client";

import { usePipelineStore } from "@/store/pipeline-store";

export function VideoGenerationPanel() {
  const { videoJobs, currentStage } = usePipelineStore();

  if (
    currentStage !== "generating_video" &&
    currentStage !== "video_completed"
  ) {
    return null;
  }

  const completedCount = videoJobs.filter(
    (j) => j.status === "completed"
  ).length;
  const failedCount = videoJobs.filter((j) => j.status === "failed").length;
  const totalCount = videoJobs.length;
  const overallProgress =
    totalCount > 0
      ? Math.round(
          videoJobs.reduce((sum, j) => {
            if (j.status === "completed") return sum + 100;
            if (j.status === "failed") return sum + 0;
            return sum + (j.progress || 0);
          }, 0) / totalCount
        )
      : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Video Generation</h3>
          <p className="text-sm text-muted mt-1">
            {completedCount}/{totalCount} scenes completed
            {failedCount > 0 && ` (${failedCount} failed)`}
          </p>
        </div>
        <span className="text-2xl font-bold text-accent">
          {overallProgress}%
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="w-full h-2 bg-border rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Per-scene status */}
      <div className="space-y-3">
        {videoJobs.map((job, i) => (
          <div
            key={job.id}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-mono">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">Scene {i + 1}</span>
              </div>
              <StatusBadge status={job.status} />
            </div>

            {/* Scene progress bar */}
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  job.status === "completed"
                    ? "bg-success"
                    : job.status === "failed"
                      ? "bg-error"
                      : "bg-accent"
                }`}
                style={{
                  width: `${job.status === "completed" ? 100 : job.status === "failed" ? 100 : job.progress || 0}%`,
                }}
              />
            </div>

            {job.errorMessage && (
              <p className="text-xs text-error mt-2">{job.errorMessage}</p>
            )}

            {job.status === "completed" && job.videoUrl && (
              <div className="mt-3">
                <video
                  src={job.videoUrl}
                  controls
                  className="w-full rounded-lg max-h-48"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Download all button */}
      {currentStage === "video_completed" && completedCount > 0 && (
        <div className="mt-6 text-center">
          <p className="text-success font-medium mb-2">
            Video generation complete!
          </p>
          <p className="text-sm text-muted">
            {completedCount} scene{completedCount !== 1 ? "s" : ""} generated
            successfully.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string }> = {
    pending: { text: "Pending", className: "bg-border text-muted" },
    queued: { text: "Queued", className: "bg-warning/10 text-warning" },
    in_progress: {
      text: "In Progress",
      className: "bg-accent/10 text-accent",
    },
    completed: { text: "Done", className: "bg-success/10 text-success" },
    failed: { text: "Failed", className: "bg-error/10 text-error" },
  };

  const c = config[status] || config.pending;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${c.className}`}>
      {c.text}
    </span>
  );
}
