import { Entry } from "./types";

const KEY = "keep_entries_v1";

export function getEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    return parsed.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveEntry(entry: Entry) {
  const entries = getEntries();
  entries.unshift(entry);
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string) {
  const entries = getEntries().filter((e) => e.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function getEntry(id: string): Entry | undefined {
  return getEntries().find((e) => e.id === id);
}

export function updateEntry(updated: Entry) {
  const entries = getEntries().map((e) =>
    e.id === updated.id ? updated : e
  );
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function allTags(entries: Entry[]): string[] {
  const set = new Set<string>();
  entries.forEach((e) => e.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

const PROMPTS = [
  "What's one thing from today that's still on your mind?",
  "Where did you feel most like yourself today?",
  "What's something small that almost slipped past you today?",
  "Who did you think about today, and why?",
  "What took more out of you today than it should have?",
  "What's a moment today you'd want to remember a year from now?",
  "What did you avoid today, and what would happen if you didn't?",
];

export function getTodaysPrompt(): string {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return PROMPTS[hash % PROMPTS.length];
}
