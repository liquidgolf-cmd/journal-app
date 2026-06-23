"use client";

import { useEffect, useRef, useState } from "react";
import { getRecordingFormat } from "@/lib/recording";

const MAX_RECORDING_SECONDS = 10 * 60;
const WARN_AT_SECONDS = 8 * 60;
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

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
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const formatRef = useRef(getRecordingFormat());

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function transcribe(blob: Blob) {
    if (blob.size > MAX_AUDIO_BYTES) {
      const mb = (blob.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `Recording is too large (${mb} MB). Try a shorter clip or type your note below.`
      );
    }
    const { extension } = formatRef.current;
    const fd = new FormData();
    fd.append("audio", blob, `recording.${extension}`);
    const res = await fetch("/api/transcribe", {
      method: "POST",
      body: fd,
    });
    const raw = await res.text();
    let data: { error?: string; text?: string } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error("Unexpected server response. Try again or type your note.");
    }
    if (!res.ok) throw new Error(data.error || "Transcription failed");
    onTranscript(data.text || "");
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      formatRef.current = getRecordingFormat();
      const { mimeType } = formatRef.current;
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stopTracks();
        clearTimer();
        const blobType =
          mr.mimeType || mimeType || chunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size === 0) {
          setError(
            "No audio was captured. Try again or type your note below."
          );
          setSeconds(0);
          secondsRef.current = 0;
          return;
        }
        const hitLimit = secondsRef.current >= MAX_RECORDING_SECONDS;
        setBusy(true);
        try {
          await transcribe(blob);
        } catch (e: any) {
          setError(
            hitLimit
              ? "Hit the 10-minute limit. Transcription may have failed — try a shorter recording or type below."
              : e.message || "Something went wrong transcribing that."
          );
        } finally {
          setBusy(false);
          setSeconds(0);
          secondsRef.current = 0;
        }
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      setRecording(true);
      setSeconds(0);
      secondsRef.current = 0;
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          secondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch {
      setError(
        "Couldn't access the microphone. Check your browser permissions."
      );
    }
  }

  function stop() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }
    mediaRecorderRef.current.stop();
    setRecording(false);
  }

  useEffect(() => {
    if (recording && seconds >= MAX_RECORDING_SECONDS) {
      stop();
    }
  }, [recording, seconds]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
    };
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const nearingLimit = recording && seconds >= WARN_AT_SECONDS;

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
      <p className="mt-3 text-sm text-[#8a8170] text-center">
        {busy
          ? "Transcribing..."
          : recording
          ? `Recording · ${mm}:${ss}`
          : "Tap to start recording"}
      </p>
      {!recording && !busy && (
        <p className="mt-1 text-xs text-[#5e5746] text-center">
          Recordings auto-stop at 10 minutes
        </p>
      )}
      {nearingLimit && seconds < MAX_RECORDING_SECONDS && (
        <p className="mt-2 text-xs text-amberlight text-center">
          Approaching 10-minute limit — wrap up soon
        </p>
      )}
      {recording && seconds >= MAX_RECORDING_SECONDS && (
        <p className="mt-2 text-xs text-amberlight text-center">
          Max length reached — stopping…
        </p>
      )}
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
