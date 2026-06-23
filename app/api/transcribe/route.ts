import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

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

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
