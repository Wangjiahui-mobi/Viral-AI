"use client";

import { useState } from "react";
import { useVideoAnalysis } from "@/lib/hooks/useVideoAnalysis";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const { analyzeVideo, isLoading, error } = useVideoAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    analyzeVideo(url.trim());
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          Clone Any Viral Video
        </h2>
        <p className="text-muted text-lg">
          Paste a TikTok or YouTube link to analyze and recreate the viral formula
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/... or https://youtube.com/..."
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? "Analyzing..." : "Analyze Video"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z" />
            </svg>
            TikTok
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            YouTube
          </span>
        </div>

        {error && (
          <p className="mt-3 text-error text-sm text-center animate-fade-in">{error}</p>
        )}
      </form>
    </div>
  );
}
