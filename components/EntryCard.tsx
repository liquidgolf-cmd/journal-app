import Link from "next/link";
import { Entry } from "@/lib/types";

export default function EntryCard({
  entry,
  onDelete,
}: {
  entry: Entry;
  onDelete?: (id: string) => void;
}) {
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-card text-ink rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-wide text-[#7a6a4a]">
          {date} · {entry.kind === "meeting" ? "Meeting" : "Journal"}
          {entry.source === "granola" && " · Granola"}
        </span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(entry.id);
            }}
            className="text-[#7a6a4a] text-xs hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>
      <Link href={`/archive/${entry.id}`} className="block group">
        <h3 className="font-serif text-xl mb-2 group-hover:text-[#5a4a2a]">
          {entry.headline}
        </h3>
        <p className="text-sm text-[#3a3326] mb-3 line-clamp-3">{entry.rawText}</p>
      </Link>
      <div className="flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-3 py-1 rounded-full border border-amber text-amber bg-[#e7d9b6]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
