import { Entry } from "./types";

const GRANOLA_API = "https://public-api.granola.ai";

export interface GranolaTranscriptLine {
  speaker?: { source?: string; name?: string };
  text: string;
}

export interface GranolaNote {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  web_url?: string | null;
  summary_text?: string | null;
  summary_markdown?: string | null;
  transcript?: GranolaTranscriptLine[] | null;
  attendees?: { name?: string | null; email?: string | null }[];
  calendar_event?: { event_title?: string | null } | null;
}

export interface GranolaListResponse {
  notes: { id: string; updated_at: string }[];
  hasMore: boolean;
  cursor: string | null;
}

function formatTranscript(lines: GranolaTranscriptLine[]): string {
  return lines
    .map((line) => {
      const label = line.speaker?.name || line.speaker?.source;
      return label ? `${label}: ${line.text}` : line.text;
    })
    .join("\n");
}

export function granolaNoteToEntry(note: GranolaNote): Entry {
  const summary =
    note.summary_markdown?.trim() || note.summary_text?.trim() || "";
  const transcript = note.transcript?.length
    ? formatTranscript(note.transcript)
    : "";

  const bodyParts: string[] = [];
  if (summary) bodyParts.push(summary);
  if (transcript) {
    bodyParts.push(`---\n\n## Transcript\n\n${transcript}`);
  }

  const headline =
    note.title?.trim() ||
    note.calendar_event?.event_title?.trim() ||
    summary.split("\n").find((l) => l.trim())?.slice(0, 80) ||
    "Meeting notes";

  const rawText =
    bodyParts.join("\n\n") ||
    headline ||
    "Imported from Granola (no summary or transcript available).";

  return {
    id: crypto.randomUUID(),
    createdAt: note.created_at,
    kind: "meeting",
    source: "granola",
    rawText,
    headline: headline.slice(0, 120),
    tags: ["meeting", "granola"],
    aiGenerated: true,
    granolaNoteId: note.id,
    granolaWebUrl: note.web_url || undefined,
  };
}

export async function granolaFetch<T>(
  apiKey: string,
  path: string
): Promise<T> {
  const res = await fetch(`${GRANOLA_API}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
        ? data.error
        : `Granola API error (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function listGranolaNotes(
  apiKey: string,
  updatedAfter: string
): Promise<{ id: string; updated_at: string }[]> {
  const notes: { id: string; updated_at: string }[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams({ updated_after: updatedAfter });
    if (cursor) params.set("cursor", cursor);
    const page = await granolaFetch<GranolaListResponse>(
      apiKey,
      `/v1/notes?${params}`
    );
    notes.push(...page.notes);
    cursor = page.hasMore ? page.cursor : null;
  } while (cursor);

  return notes;
}

export async function getGranolaNote(
  apiKey: string,
  noteId: string
): Promise<GranolaNote> {
  const params = new URLSearchParams({ include: "transcript" });
  return granolaFetch<GranolaNote>(
    apiKey,
    `/v1/notes/${noteId}?${params}`
  );
}
