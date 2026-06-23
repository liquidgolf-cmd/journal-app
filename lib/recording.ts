export interface RecordingFormat {
  mimeType: string;
  extension: string;
}

const CANDIDATES: RecordingFormat[] = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm" },
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/mp4", extension: "mp4" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
  { mimeType: "audio/ogg", extension: "ogg" },
];

export function getRecordingFormat(): RecordingFormat {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "audio/webm", extension: "webm" };
  }
  for (const candidate of CANDIDATES) {
    if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
      return candidate;
    }
  }
  return { mimeType: "", extension: "webm" };
}

export function extensionForMime(type: string, fallback = "webm"): string {
  const lower = type.toLowerCase();
  if (lower.includes("mp4") || lower.includes("m4a")) return "mp4";
  if (lower.includes("ogg")) return "ogg";
  if (lower.includes("wav")) return "wav";
  if (lower.includes("webm")) return "webm";
  return fallback;
}
