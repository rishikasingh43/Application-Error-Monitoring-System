import { Flame, BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TopError } from "./types";
import { formatRelative, levelBadgeClass } from "./utils";

interface ReportsProps {
  topErrors: TopError[];
  byApplication: { application: string; count: number; errors: number }[];
  categories: { level: string; count: number }[];
}

export default function Reports({
  topErrors,
  byApplication,
  categories,
}: ReportsProps) {
  const total = categories.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame size={18} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Most Frequently Occurring Errors
          </h3>
        </div>
        {topErrors.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>
        ) : (
          <ul className="space-y-2">
            {topErrors.map((e, idx) => (
              <li
                key={`${e.message}-${e.level}`}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">
                    {e.message}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {e.application} · last seen {formatRelative(e.last_seen)}
                  </p>
                </div>
                <span className={levelBadgeClass(e.level)}>{e.level}</span>
                <span className="flex-none text-sm font-semibold text-slate-200">
                  {e.occurrences}×
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Errors by Application
            </h3>
          </div>
          {byApplication.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byApplication} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="application"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                    cursor={{ fill: "#1e293b66" }}
                  />
                  <Bar dataKey="count" name="Total" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="errors" name="Errors" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Category Distribution
            </h3>
          </div>
          <div className="space-y-4">
            {categories.map((c) => {
              const pct = Math.round((c.count / total) * 100);
              const barColor =
                c.level === "INFO"
                  ? "bg-sky-500"
                  : c.level === "WARNING"
                  ? "bg-amber-500"
                  : "bg-rose-500";
              return (
                <div key={c.level}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{c.level}</span>
                    <span className="text-slate-400">
                      {c.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
