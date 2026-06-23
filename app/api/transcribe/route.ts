import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await toFile(buffer, file.name || "recording.webm", {
      type: file.type || "audio/webm",
    });

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
  } catch (err: any) {
    console.error("Transcription failed:", err?.message || err);
    const message =
      err?.error?.message ||
      err?.message ||
      "Transcription failed. Try again or type your note instead.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
