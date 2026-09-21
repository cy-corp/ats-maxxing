import { NextRequest, NextResponse } from "next/server";
import { buildPdfBuffer } from "@/lib/export/pdf";
import type { OptimizedResume } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const resume = (await req.json()) as OptimizedResume;
    if (!resume?.contact?.name) {
      return NextResponse.json({ error: "Invalid resume" }, { status: 400 });
    }
    const buffer = await buildPdfBuffer(resume);
    const filename = `${resume.contact.name.replace(/\s+/g, "_")}_ATS.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF export failed" }, { status: 500 });
  }
}
