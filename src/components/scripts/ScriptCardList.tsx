"use client";

import { usePipelineStore } from "@/store/pipeline-store";
import { useScriptGeneration } from "@/lib/hooks/useScriptGeneration";
import { ScriptCard } from "./ScriptCard";

export function ScriptCardList() {
  const { scripts, selectedScriptId, selectScript } = usePipelineStore();
  const { refineScript, isLoading } = useScriptGeneration();

  if (scripts.length === 0) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Creative Scripts</h3>
          <p className="text-sm text-muted mt-1">
            {scripts.length} scripts generated. Select one to deep refine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scripts.map((script) => (
          <ScriptCard
            key={script.id}
            script={script}
            isSelected={selectedScriptId === script.id}
            onSelect={() => selectScript(script.id)}
            onRefine={() => refineScript(script.id)}
            isRefining={isLoading && selectedScriptId === script.id}
          />
        ))}
      </div>
    </div>
  );
}
