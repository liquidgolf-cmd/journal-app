"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Recorder from "@/components/Recorder";
import { saveEntry, getTodaysPrompt } from "@/lib/storage";
import { Entry, EntryKind } from "@/lib/types";

type Mode = "prompt" | "record";
type Step = "capture" | "fork" | "review";

export default function CapturePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("prompt");
  const [step, setStep] = useState<Step>("capture");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<EntryKind>("journal");
  const [aiMode, setAiMode] = useState<"ai" | "manual">("ai");
  const [headline, setHeadline] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const todaysPrompt = getTodaysPrompt();

  function reset() {
    setText("");
    setHeadline("");
    setTagsInput("");
    setStep("capture");
    setSaved(false);
  }

  async function goToReview() {
    if (!text.trim()) return;
    if (aiMode === "ai") {
      setGenerating(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, kind }),
        });
        const data = await res.json();
        setHeadline(data.headline || "");
        setTagsInput((data.tags || []).join(", "));
      } catch {
        setHeadline(text.slice(0, 40));
        setTagsInput(kind);
      } finally {
        setGenerating(false);
      }
    } else {
      setHeadline(text.slice(0, 40));
      setTagsInput("");
    }
    setStep("review");
  }

  function handleSave() {
    const entry: Entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      kind,
      source: mode === "prompt" ? "prompt" : "ambient",
      rawText: text,
      headline: headline || text.slice(0, 40),
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      aiGenerated: aiMode === "ai",
      promptQuestion: mode === "prompt" ? todaysPrompt : undefined,
    };
    saveEntry(entry);
    setSaved(true);
    setTimeout(() => {
      router.push("/archive");
    }, 700);
  }

  return (
    <div className="pt-2">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setMode("prompt");
            setKind("journal");
            reset();
          }}
          className={`flex-1 py-2 rounded-lg text-sm uppercase tracking-wide border ${
            mode === "prompt"
              ? "bg-amber text-ink border-amber"
              : "border-[#3a3324] text-[#8a8170]"
          }`}
        >
          Daily Prompt
        </button>
        <button
          onClick={() => {
            setMode("record");
            reset();
          }}
          className={`flex-1 py-2 rounded-lg text-sm uppercase tracking-wide border ${
            mode === "record"
              ? "bg-amber text-ink border-amber"
              : "border-[#3a3324] text-[#8a8170]"
          }`}
        >
          Record
        </button>
      </div>

      {step === "capture" && mode === "prompt" && (
        <div>
          <p className="text-xs uppercase tracking-wide text-amberlight mb-2">
            Today's question
          </p>
          <p className="font-serif text-2xl mb-5 leading-snug">{todaysPrompt}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write as much or as little as you want..."
            className="w-full min-h-[160px] bg-[#241F14] border border-[#3a3324] rounded-lg p-4 text-paper"
          />
          <ModeToggle aiMode={aiMode} setAiMode={setAiMode} />
          <button
            onClick={goToReview}
            disabled={!text.trim() || generating}
            className="mt-4 w-full py-3 rounded-lg bg-amber text-ink font-medium disabled:opacity-40"
          >
            {generating ? "Thinking..." : "Continue"}
          </button>
        </div>
      )}

      {step === "capture" && mode === "record" && (
        <div>
          <p className="text-sm text-[#8a8170] mb-2">
            Record a conversation, a meeting, or just a moment you want to remember.
          </p>
          <Recorder
            onTranscript={(t) => {
              setText(t);
              setStep("fork");
            }}
          />
          <div className="mt-2">
            <p className="text-xs text-center text-[#5e5746] mb-2">or</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="...type or paste what was said instead"
              className="w-full min-h-[100px] bg-[#241F14] border border-[#3a3324] rounded-lg p-4 text-paper"
            />
            {text && (
              <button
                onClick={() => setStep("fork")}
                className="mt-3 w-full py-3 rounded-lg bg-amber text-ink font-medium"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {step === "fork" && (
        <div>
          <p className="font-serif text-xl mb-4">Was this personal or work?</p>
          <div className="bg-[#241F14] border border-[#3a3324] rounded-lg p-4 mb-5 text-sm text-[#c9bfa6] max-h-40 overflow-y-auto">
            {text}
          </div>
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setKind("journal")}
              className={`flex-1 py-3 rounded-lg border ${
                kind === "journal"
                  ? "bg-amber text-ink border-amber"
                  : "border-[#3a3324] text-[#8a8170]"
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setKind("meeting")}
              className={`flex-1 py-3 rounded-lg border ${
                kind === "meeting"
                  ? "bg-amber text-ink border-amber"
                  : "border-[#3a3324] text-[#8a8170]"
              }`}
            >
              Work / Meeting
            </button>
          </div>
          <ModeToggle aiMode={aiMode} setAiMode={setAiMode} />
          <button
            onClick={goToReview}
            disabled={generating}
            className="mt-4 w-full py-3 rounded-lg bg-amber text-ink font-medium disabled:opacity-40"
          >
            {generating ? "Thinking..." : "Continue"}
          </button>
        </div>
      )}

      {step === "review" && (
        <div>
          <p className="text-xs uppercase tracking-wide text-amberlight mb-2">
            {aiMode === "ai" ? "AI suggested — edit anything" : "Your entry"}
          </p>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Headline"
            className="w-full bg-[#241F14] border border-[#3a3324] rounded-lg p-3 mb-3 font-serif text-lg"
          />
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="tags, comma, separated"
            className="w-full bg-[#241F14] border border-[#3a3324] rounded-lg p-3 mb-5 text-sm"
          />
          <div className="bg-[#241F14] border border-[#3a3324] rounded-lg p-4 mb-5 text-sm text-[#c9bfa6] max-h-40 overflow-y-auto">
            {text}
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-amber text-ink font-medium"
          >
            {saved ? "Saved!" : "Save Entry"}
          </button>
        </div>
      )}
    </div>
  );
}

function ModeToggle({
  aiMode,
  setAiMode,
}: {
  aiMode: "ai" | "manual";
  setAiMode: (m: "ai" | "manual") => void;
}) {
  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => setAiMode("ai")}
        className={`flex-1 py-2 rounded-lg text-sm border ${
          aiMode === "ai"
            ? "bg-amber/20 border-amber text-amberlight"
            : "border-[#3a3324] text-[#8a8170]"
        }`}
      >
        ✨ AI Suggested
      </button>
      <button
        onClick={() => setAiMode("manual")}
        className={`flex-1 py-2 rounded-lg text-sm border ${
          aiMode === "manual"
            ? "bg-amber/20 border-amber text-amberlight"
            : "border-[#3a3324] text-[#8a8170]"
        }`}
      >
        ✍️ Manual
      </button>
    </div>
  );
}
