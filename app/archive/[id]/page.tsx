"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteEntry, getEntry, updateEntry } from "@/lib/storage";
import { Entry } from "@/lib/types";

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [rawText, setRawText] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const found = getEntry(id);
    if (!found) {
      setEntry(null);
      return;
    }
    setEntry(found);
    setHeadline(found.headline);
    setTagsInput(found.tags.join(", "));
    setRawText(found.rawText);
  }, [id]);

  function handleSave() {
    if (!entry) return;
    const updated: Entry = {
      ...entry,
      headline: headline || entry.headline,
      rawText,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    };
    updateEntry(updated);
    setEntry(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleDelete() {
    deleteEntry(id);
    router.push("/archive");
  }

  if (entry === null) {
    return (
      <div className="pt-2 text-center py-16">
        <p className="text-sm text-[#5e5746] mb-4">Entry not found.</p>
        <Link href="/archive" className="text-sm text-amber hover:text-amberlight">
          ← Back to Archive
        </Link>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="pt-2">
      <Link
        href="/archive"
        className="text-sm text-[#8a8170] hover:text-amberlight mb-4 inline-block"
      >
        ← Archive
      </Link>

      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="text-xs uppercase tracking-wide text-amberlight">
          {date} · {entry.kind === "meeting" ? "Meeting" : "Journal"}
        </span>
        <div className="flex gap-3 shrink-0">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#8a8170] hover:text-amberlight"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-[#8a8170] hover:text-red-400"
          >
            Remove
          </button>
        </div>
      </div>

      {entry.promptQuestion && (
        <p className="text-sm text-[#8a8170] italic mb-4">
          &ldquo;{entry.promptQuestion}&rdquo;
        </p>
      )}

      {editing ? (
        <div>
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
            className="w-full bg-[#241F14] border border-[#3a3324] rounded-lg p-3 mb-3 text-sm"
          />
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full min-h-[200px] bg-[#241F14] border border-[#3a3324] rounded-lg p-4 mb-4 text-paper text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-lg bg-amber text-ink font-medium"
            >
              {saved ? "Saved!" : "Save changes"}
            </button>
            <button
              onClick={() => {
                setHeadline(entry.headline);
                setTagsInput(entry.tags.join(", "));
                setRawText(entry.rawText);
                setEditing(false);
              }}
              className="px-5 py-3 rounded-lg border border-[#3a3324] text-[#8a8170]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-serif text-3xl mb-4 leading-snug">{entry.headline}</h1>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full border border-amber text-amber"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="bg-[#241F14] border border-[#3a3324] rounded-lg p-4 text-sm text-[#c9bfa6] leading-relaxed whitespace-pre-wrap">
            {entry.rawText}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Remove this entry?"
        message="This can't be undone. The entry will be deleted from this device."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
