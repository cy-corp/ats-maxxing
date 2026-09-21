"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resumeToMarkdown, resumeToPlainText } from "@/lib/export/format";
import type { OptimizedResume } from "@/lib/types";
import { downloadBlob, downloadText } from "@/lib/utils";

export function DownloadBar({ resume }: { resume: OptimizedResume }) {
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const base = resume.contact.name.replace(/\s+/g, "_") || "resume";

  async function exportBinary(kind: "pdf" | "docx") {
    setBusy(kind);
    try {
      const res = await fetch(`/api/export/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume),
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      downloadBlob(blob, `${base}_ATS.${kind}`);
    } catch {
      alert(`Could not export ${kind.toUpperCase()}. Try again.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          downloadText(resumeToPlainText(resume), `${base}_ATS.txt`, "text/plain")
        }
      >
        <Download /> .txt
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          downloadText(
            resumeToMarkdown(resume),
            `${base}_ATS.md`,
            "text/markdown",
          )
        }
      >
        <Download /> .md
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy === "pdf"}
        onClick={() => void exportBinary("pdf")}
      >
        {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />}
        .pdf
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy === "docx"}
        onClick={() => void exportBinary("docx")}
      >
        {busy === "docx" ? <Loader2 className="animate-spin" /> : <Download />}
        .docx
      </Button>
    </div>
  );
}
