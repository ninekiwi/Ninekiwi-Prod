import { NextResponse } from "next/server";
import { createRequire } from "module";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const req = createRequire(import.meta.url);
    // Resolve the bundled UMD file from the installed package
    const filePath = req.resolve("html-docx-js/dist/html-docx.js");
    const buf = await fs.promises.readFile(filePath);
    return new NextResponse(buf, {
      headers: {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    return new NextResponse("// html-docx-js not available", { status: 404 });
  }
}

