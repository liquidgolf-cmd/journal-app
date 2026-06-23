import { NextRequest, NextResponse } from "next/server";
import {
  getGranolaNote,
  GranolaApiError,
  granolaNoteToEntry,
  listGranolaNotes,
} from "@/lib/granola";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_NOTES_PER_IMPORT = 25;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey =
      (typeof body.apiKey === "string" && body.apiKey.trim()) ||
      process.env.GRANOLA_API_KEY ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No Granola API key. Add one in Archive → Granola, or set GRANOLA_API_KEY on the server.",
        },
        { status: 400 }
      );
    }

    if (!apiKey.startsWith("grn_")) {
      return NextResponse.json(
        { error: "Invalid Granola API key format. Keys start with grn_." },
        { status: 400 }
      );
    }

    const since =
      typeof body.since === "string" && body.since
        ? body.since
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const skipIds = new Set(
      Array.isArray(body.importedIds)
        ? body.importedIds.filter((id: unknown) => typeof id === "string")
        : []
    );

    const listed = await listGranolaNotes(apiKey, since);
    const toFetch = listed
      .filter((n) => !skipIds.has(n.id))
      .slice(0, MAX_NOTES_PER_IMPORT);

    const entries = [];
    const errors: string[] = [];

    for (const note of toFetch) {
      try {
        const full = await getGranolaNote(apiKey, note.id);
        entries.push(granolaNoteToEntry(full));
      } catch (err: any) {
        errors.push(`${note.id}: ${err?.message || "fetch failed"}`);
      }
    }

    const remaining =
      listed.filter((n) => !skipIds.has(n.id)).length - toFetch.length;

    return NextResponse.json({
      entries,
      listed: listed.length,
      fetched: toFetch.length,
      imported: entries.length,
      hasMore: remaining > 0,
      remaining,
      errors,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Granola import failed:", err?.message);
    if (err instanceof GranolaApiError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Granola import failed" },
      { status: 500 }
    );
  }
}
