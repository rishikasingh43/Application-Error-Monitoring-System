import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import type { ErrorLevel, ErrorRecord } from "./types";
import { formatDateTime, levelBadgeClass } from "./utils";

interface ErrorTableProps {
  rows: ErrorRecord[];
  total: number;
  loading: boolean;
  search: string;
  level: ErrorLevel | "ALL";
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
  onSearchChange: (v: string) => void;
  onLevelChange: (v: ErrorLevel | "ALL") => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ErrorTable(props: ErrorTableProps) {
  const {
    rows,
    total,
    loading,
    search,
    level,
    fromDate,
    toDate,
    page,
    pageSize,
    onSearchChange,
    onLevelChange,
    onFromDateChange,
    onToDateChange,
    onPageChange,
    onSelect,
    onDelete,
  } = props;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">All Error Records</h3>
          <p className="text-xs text-slate-500">{total} record(s) found</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            className="input pl-9"
            placeholder="Search message or app..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={level}
          onChange={(e) => onLevelChange(e.target.value as ErrorLevel | "ALL")}
        >
          <option value="ALL">All levels</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
        </select>
        <div>
          <input
            type="date"
            className="input"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            aria-label="From date"
          />
        </div>
        <div>
          <input
            type="date"
            className="input"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            aria-label="To date"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3 font-medium">Level</th>
              <th className="px-3 py-3 font-medium">Message</th>
              <th className="px-3 py-3 font-medium">Application</th>
              <th className="px-3 py-3 font-medium">Module</th>
              <th className="px-3 py-3 font-medium">Timestamp</th>
              <th className="px-3 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  Loading records...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No records match your filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40">
                  <td className="px-3 py-3">
                    <span className={levelBadgeClass(r.level)}>{r.level}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="max-w-xs truncate font-medium text-slate-200">
                      {r.message}
                    </p>
                    <p className="font-mono text-[11px] text-slate-600">{r.id}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{r.application}</td>
                  <td className="px-3 py-3 text-slate-400">{r.module}</td>
                  <td className="px-3 py-3 text-slate-400">
                    {formatDateTime(r.timestamp)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onSelect(r.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        aria-label="View details"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {confirmId === r.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDelete(r.id);
                              setConfirmId(null);
                            }}
                            className="rounded-md bg-rose-600/20 px-2 py-1 text-xs text-rose-300 hover:bg-rose-600/40"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(r.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-600/20 hover:text-rose-300"
                          aria-label="Delete record"
                          title="Delete record"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              className="btn-ghost px-2 py-1.5"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-ghost px-2 py-1.5"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
