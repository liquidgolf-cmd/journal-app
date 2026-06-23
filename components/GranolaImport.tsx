"use client";

import { useState } from "react";
import {
  clearGranolaApiKey,
  getGranolaApiKey,
  getGranolaLastSync,
  nextGranolaSince,
  setGranolaApiKey,
  setGranolaLastSync,
} from "@/lib/granola-settings";
import { getImportedGranolaNoteIds, importEntries } from "@/lib/storage";
import { Entry } from "@/lib/types";

export default function GranolaImport({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  function loadSettings() {
    const key = getGranolaApiKey();
    setHasKey(!!key);
    setApiKeyInput(key ? "••••••••••••" : "");
    setLastSync(getGranolaLastSync());
  }

  function handleOpen() {
    loadSettings();
    setOpen((v) => !v);
    setMessage(null);
    setError(null);
  }

  function handleSaveKey() {
    if (!apiKey.trim() || apiKey.includes("•")) return;
    setGranolaApiKey(apiKey);
    setHasKey(true);
    setApiKeyInput("••••••••••••");
    setMessage("API key saved in this browser only.");
    setError(null);
  }

  function handleClearKey() {
    clearGranolaApiKey();
    setHasKey(false);
    setApiKeyInput("");
    setMessage("API key removed from this browser.");
  }

  async function handleImport() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const key = getGranolaApiKey();
      const res = await fetch("/api/granola/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key || undefined,
          since: nextGranolaSince(),
          importedIds: getImportedGranolaNoteIds(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      const added = importEntries((data.entries || []) as Entry[]);
      if (data.syncedAt) {
        setGranolaLastSync(data.syncedAt);
        setLastSync(data.syncedAt);
      }

      const parts: string[] = [];
      if (added > 0) parts.push(`${added} new meeting${added === 1 ? "" : "s"} imported`);
      else parts.push("No new meetings to import");
      if (data.hasMore) {
        parts.push(`${data.remaining} more available — import again`);
      }
      if (data.errors?.length) {
        parts.push(`${data.errors.length} note(s) skipped due to errors`);
      }
      setMessage(parts.join(". ") + ".");
      onImported();
    } catch (e: any) {
      setError(e.message || "Something went wrong importing from Granola.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-[#3a3324] bg-[#241F14] overflow-hidden">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm text-amberlight">Meetings from Granola</p>
          <p className="text-xs text-[#8a8170] mt-0.5">
            Import notes captured in Granola into this archive
          </p>
        </div>
        <span className="text-[#8a8170] text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#3a3324] pt-4">
          <p className="text-xs text-[#8a8170] mb-3 leading-relaxed">
            Use Granola for meeting capture, then pull finished notes here.
            Create a key in Granola → Settings → Connectors → API keys
            (Business or Enterprise plan).
          </p>

          <label className="text-xs uppercase tracking-wide text-[#8a8170] block mb-1">
            Granola API key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            onFocus={() => {
              if (apiKey.includes("•")) setApiKeyInput("");
            }}
            placeholder="grn_..."
            className="w-full bg-[#1A1A1A] border border-[#3a3324] rounded-lg p-3 mb-2 text-sm"
          />
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || apiKey.includes("•")}
              className="px-3 py-1.5 rounded-lg text-xs border border-amber text-amber disabled:opacity-40"
            >
              Save key locally
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={handleClearKey}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#3a3324] text-[#8a8170]"
              >
                Remove key
              </button>
            )}
          </div>

          {lastSync && (
            <p className="text-xs text-[#5e5746] mb-3">
              Last import:{" "}
              {new Date(lastSync).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={busy || !hasKey}
            className="w-full py-2.5 rounded-lg bg-amber text-ink text-sm font-medium disabled:opacity-40"
          >
            {busy ? "Importing from Granola…" : "Import meetings"}
          </button>

          {message && (
            <p className="mt-3 text-xs text-amberlight">{message}</p>
          )}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </div>
      )}
    </div>
  );
}
