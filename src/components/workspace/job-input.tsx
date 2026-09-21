"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { scrapeJobAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface JobInputProps {
  value: string;
  onChange: (value: string) => void;
  meta?: { title?: string; company?: string } | null;
  onMeta: (meta: { title?: string; company?: string } | null) => void;
}

export function JobInput({ value, onChange, meta, onMeta }: JobInputProps) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scrape() {
    setError(null);
    setBusy(true);
    try {
      const result = await scrapeJobAction(url);
      if (!result.success || !result.text) {
        setError(result.error ?? "Scrape failed.");
        onMeta({ title: result.title, company: result.company });
        return;
      }
      onChange(result.text);
      onMeta({ title: result.title, company: result.company });
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Job posting</Label>
        <span className="font-mono text-[10px] text-[var(--muted)]">
          URL or paste
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://company.com/jobs/…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !url.trim()}
          onClick={() => void scrape()}
        >
          {busy ? <Loader2 className="animate-spin" /> : "Scrape"}
        </Button>
      </div>

      {error ? (
        <p className="font-mono text-xs text-[var(--warning)]">{error}</p>
      ) : null}

      {meta?.title || meta?.company ? (
        <p className="font-mono text-[11px] text-[var(--muted)]">
          {meta.company ? `${meta.company} · ` : ""}
          {meta.title}
        </p>
      ) : null}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job page / description here (fallback if scrape fails)"
        className="min-h-[200px] text-[12px] leading-relaxed"
      />
    </div>
  );
}
