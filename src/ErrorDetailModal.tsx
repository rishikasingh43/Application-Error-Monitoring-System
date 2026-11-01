import { useEffect } from "react";
import { X, Server, Boxes, Calendar, FileText, Hash, AlertCircle } from "lucide-react";
import type { ErrorRecord } from "./types";
import { formatDateTime, levelBadgeClass } from "./utils";

interface ErrorDetailModalProps {
  record: ErrorRecord | null;
  loading: boolean;
  onClose: () => void;
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Server;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <Icon size={16} className="mt-0.5 flex-none text-slate-500" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="break-words text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export default function ErrorDetailModal({
  record,
  loading,
  onClose,
}: ErrorDetailModalProps) {
  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [record, onClose]);

  if (!record && !loading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-detail-title"
        className="card w-full max-w-2xl p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="error-detail-title" className="text-lg font-semibold text-slate-100">
            Error Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-500">
            Loading...
          </div>
        ) : record ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={levelBadgeClass(record.level)}>{record.level}</span>
              <span className="font-mono text-xs text-slate-600">{record.id}</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <AlertCircle size={14} />
                Message
              </div>
              <p className="text-base font-medium text-slate-100">{record.message}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field icon={Server} label="Application" value={record.application} />
              <Field icon={Boxes} label="Module" value={record.module} />
              <Field
                icon={Calendar}
                label="Timestamp"
                value={formatDateTime(record.timestamp)}
              />
              <Field
                icon={Hash}
                label="Created At"
                value={formatDateTime(record.created_at)}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <FileText size={14} />
                Description
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                <p className="whitespace-pre-wrap text-sm text-slate-300">
                  {record.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-slate-500">
            Record not found.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
