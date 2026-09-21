import { NextRequest, NextResponse } from "next/server";
import { buildDocxBuffer } from "@/lib/export/docx";
import type { OptimizedResume } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const resume = (await req.json()) as OptimizedResume;
    if (!resume?.contact?.name) {
      return NextResponse.json({ error: "Invalid resume" }, { status: 400 });
    }
    const buffer = await buildDocxBuffer(resume);
    const filename = `${resume.contact.name.replace(/\s+/g, "_")}_ATS.docx`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "DOCX export failed" }, { status: 500 });
  }
}
