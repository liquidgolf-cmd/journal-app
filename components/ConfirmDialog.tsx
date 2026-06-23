"use client";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Remove",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-[#241F14] border border-[#3a3324] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl mb-2">{title}</h2>
        <p className="text-sm text-[#8a8170] mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-[#3a3324] text-[#8a8170]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-900/80 text-red-200 border border-red-400/40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
