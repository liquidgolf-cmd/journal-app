import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { text, kind } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback so the prototype still works without a key set yet.
      const words = text.trim().split(/\s+/).slice(0, 5).join(" ");
      return NextResponse.json({
        headline: words || "Untitled entry",
        tags: kind === "meeting" ? ["meeting"] : ["journal"],
        fallback: true,
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system =
      kind === "meeting"
        ? "You summarize meeting notes. Given raw notes or a transcript, return a short, specific headline (under 8 words) and 3-5 topical tags (lowercase, single words or short phrases, no hashtags) that would help someone search for this later. Respond ONLY as compact JSON: {\"headline\": string, \"tags\": string[]}."
        : "You are a thoughtful, literary journal editor. Given a raw personal journal entry, return a short, evocative headline (under 8 words, in the style of a short story title) and 3-5 mood/theme tags (lowercase single words, no hashtags) that capture the emotional core of the entry. Respond ONLY as compact JSON: {\"headline\": string, \"tags\": string[]}.";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      headline: parsed.headline || "Untitled entry",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
