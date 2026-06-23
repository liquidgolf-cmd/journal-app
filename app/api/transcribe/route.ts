import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { extensionForMime } from "@/lib/recording";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

function uploadName(file: File): string {
  if (file.name && file.name.includes(".")) return file.name;
  const ext = extensionForMime(file.type || "");
  return `recording.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "No OPENAI_API_KEY set on the server yet, so live transcription isn't wired up. Type your note instead for now.",
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Recording was empty. Try again or type your note instead." },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error: `Recording is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Try a shorter clip.`,
        },
        { status: 400 }
      );
    }

    const name = uploadName(file);
    const type = file.type || `audio/${extensionForMime(name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await toFile(buffer, name, { type });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await client.audio.transcriptions.create({
      file: upload,
      model: "whisper-1",
    });

    const text = transcription.text?.trim();
    if (!text) {
      return NextResponse.json(
        {
          error:
            "Couldn't make out any speech in that recording. Try again or type your note instead.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const apiErr = err as {
      status?: number;
      message?: string;
      error?: { message?: string };
    };
    const message =
      apiErr?.error?.message ||
      apiErr?.message ||
      "Transcription failed. Try again or type your note instead.";

    console.error("Transcription failed:", message, {
      status: apiErr?.status,
    });

    const status =
      apiErr?.status && apiErr.status >= 400 && apiErr.status < 500
        ? apiErr.status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
