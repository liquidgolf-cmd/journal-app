export type EntryKind = "journal" | "meeting";
export type EntrySource = "prompt" | "ambient" | "manual" | "granola";

export interface Entry {
  id: string;
  createdAt: string; // ISO timestamp
  kind: EntryKind;
  source: EntrySource;
  rawText: string; // the original text (typed or transcribed)
  headline: string;
  tags: string[];
  aiGenerated: boolean; // whether headline/tags came from AI or were manual
  promptQuestion?: string; // the question that was asked, if from daily prompt
  granolaNoteId?: string; // Granola not_* id for dedup on import
  granolaWebUrl?: string; // link back to the note in Granola
}
