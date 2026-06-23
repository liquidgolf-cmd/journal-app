"use client";

import { useEffect, useMemo, useState } from "react";
import { getEntries, deleteEntry, allTags } from "@/lib/storage";
import { Entry } from "@/lib/types";
import EntryCard from "@/components/EntryCard";

export default function ArchivePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "journal" | "meeting">(
    "all"
  );
  const [tagFilter, setTagFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  function handleDelete(id: string) {
    deleteEntry(id);
    setEntries(getEntries());
  }

  const tags = useMemo(() => allTags(entries), [entries]);

  const filtered = entries.filter((e) => {
    if (kindFilter !== "all" && e.kind !== kindFilter) return false;
    if (tagFilter !== "all" && !e.tags.includes(tagFilter)) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = `${e.headline} ${e.rawText} ${e.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="pt-2">
      <h1 className="font-serif text-3xl mb-1">Everything you've kept.</h1>
      <p className="text-sm text-[#8a8170] mb-5">
        {entries.length} {entries.length === 1 ? "entry" : "entries"}
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search entries..."
        className="w-full bg-[#241F14] border border-[#3a3324] rounded-lg p-3 mb-3 text-paper"
      />

      <div className="flex gap-3 mb-3">
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as any)}
          className="flex-1 bg-[#241F14] border border-[#3a3324] rounded-lg p-3 text-sm"
        >
          <option value="all">All entries</option>
          <option value="journal">Journal only</option>
          <option value="meeting">Meetings only</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="flex-1 bg-[#241F14] border border-[#3a3324] rounded-lg p-3 text-sm"
        >
          <option value="all">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView("grid")}
          className={`px-4 py-1.5 rounded-md text-sm border ${
            view === "grid"
              ? "border-amber text-amber"
              : "border-[#3a3324] text-[#8a8170]"
          }`}
        >
          Grid
        </button>
        <button
          onClick={() => setView("list")}
          className={`px-4 py-1.5 rounded-md text-sm border ${
            view === "list"
              ? "border-amber text-amber"
              : "border-[#3a3324] text-[#8a8170]"
          }`}
        >
          List
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[#5e5746] text-center py-10">
          Nothing here yet. Go capture something.
        </p>
      )}

      <div className={view === "grid" ? "grid grid-cols-2 gap-3" : ""}>
        {filtered.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
