"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { extractPdfAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ResumeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ResumeInput({ value, onChange }: ResumeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await extractPdfAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.text) onChange(result.text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Resume</Label>
        <span className="font-mono text-[10px] text-[var(--muted)]">
          PDF or paste
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "rounded-sm border border-dashed border-[var(--border-strong)] bg-white/50 p-4 transition",
          dragging && "border-[var(--accent)] bg-[var(--accent-dim)]",
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <FileUp className="size-5 text-[var(--muted)]" />
          <p className="font-mono text-xs text-[var(--muted)]">Drop PDF here or</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            Upload PDF
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error ? (
        <p className="font-mono text-xs text-[var(--danger)]">{error}</p>
      ) : null}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste your full resume text here"
        className="min-h-[180px]"
      />
    </div>
  );
}
