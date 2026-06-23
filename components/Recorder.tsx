"use client";

import { useRef, useState } from "react";

export default function Recorder({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Transcription failed");
          onTranscript(data.text);
        } catch (e: any) {
          setError(e.message || "Something went wrong transcribing that.");
        } finally {
          setBusy(false);
          setSeconds(0);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      setError(
        "Couldn't access the microphone. Check your browser permissions."
      );
    }
  }

  function stop() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center py-6">
      <button
        onClick={recording ? stop : start}
        disabled={busy}
        className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition ${
          recording
            ? "border-red-400 bg-red-900/30 animate-pulse"
            : "border-amber bg-amber/10"
        }`}
      >
        <span className="text-2xl">{recording ? "■" : "●"}</span>
      </button>
      <p className="mt-3 text-sm text-[#8a8170]">
        {busy
          ? "Transcribing..."
          : recording
          ? `Recording · ${mm}:${ss}`
          : "Tap to start recording"}
      </p>
      {error && (
        <div className="mt-4 w-full rounded-lg border border-red-400/40 bg-red-900/20 p-3 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <p className="mt-1 text-xs text-[#8a8170]">
            Tap the button to try again, or type or paste your note below.
          </p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-2 text-xs text-[#8a8170] underline hover:text-paper"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
