"use client";

import { useState } from "react";
import { useScriptGeneration } from "@/lib/hooks/useScriptGeneration";

export function UrlInput() {
  const [url, setUrl] = useState("");
  const { generateScripts, isLoading, error } = useScriptGeneration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    generateScripts(url.trim());
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          Create Viral Product Videos
        </h2>
        <p className="text-muted text-lg">
          Paste an Amazon product link to generate creative video scripts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/B0XXXXX..."
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
            {isLoading ? "Generating..." : "Generate Scripts"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-error text-sm animate-fade-in">{error}</p>
        )}
      </form>
    </div>
  );
}
