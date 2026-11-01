import { useEffect, useRef, useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import type { ErrorLevel } from "./types";

export interface LogFormValue {
  message: string;
  level: ErrorLevel;
  application: string;
  module: string;
  description: string;
  timestamp: string;
}

interface LogFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: LogFormValue) => Promise<void>;
}

const LEVELS: ErrorLevel[] = ["INFO", "WARNING", "ERROR"];

const levelClasses: Record<ErrorLevel, string> = {
  INFO: "border-sky-500 bg-sky-500/15 text-sky-300",
  WARNING: "border-amber-500 bg-amber-500/15 text-amber-300",
  ERROR: "border-rose-500 bg-rose-500/15 text-rose-300",
};

function isoLocalNow(): string {
  const d = new Date();
  d.setSeconds(d.getSeconds(), 0);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function LogFormModal({ open, onClose, onSubmit }: LogFormModalProps) {
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState<ErrorLevel>("ERROR");
  const [application, setApplication] = useState("");
  const [module, setModule] = useState("");
  const [description, setDescription] = useState("");
  const [timestamp, setTimestamp] = useState(isoLocalNow());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setMessage("");
    setLevel("ERROR");
    setApplication("");
    setModule("");
    setDescription("");
    setTimestamp(isoLocalNow());
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!message.trim()) {
      setError("Error message is required.");
      return;
    }
    if (!application.trim()) {
      setError("Application name is required.");
      return;
    }
    if (!module.trim()) {
      setError("Module name is required.");
      return;
    }
    if (!timestamp) {
      setError("Timestamp is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        message: message.trim(),
        level,
        application: application.trim(),
        module: module.trim(),
        description: description.trim(),
        timestamp: new Date(timestamp).toISOString(),
      });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-form-title"
        className="card w-full max-w-lg p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="log-form-title" className="text-lg font-semibold text-slate-100">
            Log a New Error
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="f-message">
              Error Message *
            </label>
            <input
              id="f-message"
              className="input"
              placeholder="e.g. Failed to connect to database"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={240}
            />
          </div>

          <div>
            <span className="label">Severity Level *</span>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    level === lvl
                      ? levelClasses[lvl]
                      : "border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="f-app">
                Application Name *
              </label>
              <input
                id="f-app"
                className="input"
                placeholder="e.g. user-service"
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label className="label" htmlFor="f-module">
                Module Name *
              </label>
              <input
                id="f-module"
                className="input"
                placeholder="e.g. auth"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="f-desc">
              Description
            </label>
            <textarea
              id="f-desc"
              className="input min-h-[88px] resize-y"
              placeholder="Additional context, stack trace summary, or remediation notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div>
            <label className="label" htmlFor="f-time">
              Timestamp *
            </label>
            <input
              id="f-time"
              type="datetime-local"
              className="input"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            <Send size={16} />
            {submitting ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
