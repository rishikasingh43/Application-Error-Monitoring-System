import { AlertTriangle, Info, XCircle, Activity, ChevronRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { CategoryCount, DashboardStats, RecentActivity } from "./types";
import { formatRelative } from "./utils";

interface DashboardProps {
  stats: DashboardStats;
  categories: CategoryCount[];
  recent: RecentActivity[];
  onSelect: (id: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  INFO: "#38bdf8",
  WARNING: "#fbbf24",
  ERROR: "#f43f5e",
};

const LEVEL_ICON: Record<string, typeof Info> = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Info;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  stats,
  categories,
  recent,
  onSelect,
}: DashboardProps) {
  const chartData = categories.map((c) => ({ name: c.level, value: c.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Errors" value={stats.total} icon={Activity} accent="#60a5fa" />
        <StatCard label="Info" value={stats.info} icon={Info} accent="#38bdf8" />
        <StatCard label="Warning" value={stats.warning} icon={AlertTriangle} accent="#fbbf24" />
        <StatCard label="Error" value={stats.error} icon={XCircle} accent="#f43f5e" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">
            Errors by Category
          </h3>
          {chartData.length && chartData.some((d) => d.value > 0) ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={LEVEL_COLORS[entry.name] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-slate-500">
              No data to display
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">
            Recent Activity
          </h3>
          {recent.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-slate-500">
              No recent errors logged yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {recent.map((r) => {
                const Icon = LEVEL_ICON[r.level];
                const color = LEVEL_COLORS[r.level];
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => onSelect(r.id)}
                      className="group flex w-full items-center gap-3 py-3 text-left hover:bg-slate-800/40"
                    >
                      <span
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${color}1a`, color }}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {r.message}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {r.application} · {formatRelative(r.timestamp)}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="flex-none text-slate-600 group-hover:text-slate-400"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
