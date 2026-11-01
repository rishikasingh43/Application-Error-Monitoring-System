import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Plus,
  LayoutDashboard,
  ListChecks,
  BarChart3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { ErrorDatabase } from "./db";
import type {
  CategoryCount,
  DashboardStats,
  ErrorLevel,
  ErrorRecord,
  RecentActivity,
  TopError,
} from "./types";
import Dashboard from "./Dashboard";
import ErrorTable from "./ErrorTable";
import Reports from "./Reports";
import LogFormModal, { type LogFormValue } from "./LogFormModal";
import ErrorDetailModal from "./ErrorDetailModal";

type Tab = "dashboard" | "records" | "reports";

const db = new ErrorDatabase();
const PAGE_SIZE = 10;

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
  });
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [topErrors, setTopErrors] = useState<TopError[]>([]);
  const [byApplication, setByApplication] = useState<
    { application: string; count: number; errors: number }[]
  >([]);

  const [rows, setRows] = useState<ErrorRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<ErrorLevel | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<ErrorRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refreshDashboard = useCallback(async () => {
    const [s, c, r, t, a] = await Promise.all([
      db.stats(),
      db.countsByCategory(),
      db.recentActivity(6),
      db.topErrors(5),
      db.countByApplication(),
    ]);
    setStats(s);
    setCategories(c);
    setRecent(r);
    setTopErrors(t);
    setByApplication(a);
  }, []);

  const refreshRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const { rows: r, total } = await db.list({
        search,
        level,
        fromDate,
        toDate,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setRows(r);
      setRecordsTotal(total);
    } finally {
      setRecordsLoading(false);
    }
  }, [search, level, fromDate, toDate, page]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshDashboard(), refreshRecords()]);
  }, [refreshDashboard, refreshRecords]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await db.init();
        if (db.wasSeeded()) {
          setSeeding(true);
          setTimeout(() => setSeeding(false), 2500);
        }
        await refreshAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialize database.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAll]);

  useEffect(() => {
    if (loading) return;
    refreshRecords();
  }, [refreshRecords, loading]);

  useEffect(() => {
    setPage(1);
  }, [search, level, fromDate, toDate]);

  const handleSubmit = async (value: LogFormValue) => {
    await db.insert(value);
    await refreshAll();
  };

  const handleDelete = async (id: string) => {
    await db.delete(id);
    await refreshAll();
  };

  const openDetail = async (id: string) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const rec = await db.getById(id);
      setDetail(rec);
    } finally {
      setDetailLoading(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "records", label: "Error Records", icon: ListChecks },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 sm:text-base">
                Application Error Monitoring
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Powered by in-browser Postgres (PGlite)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost px-2.5 py-2"
              onClick={refreshAll}
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button className="btn-primary" onClick={() => setFormOpen(true)}>
              <Plus size={16} />
              <span className="hidden sm:inline">Log Error</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-primary-500 text-primary-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Seeding banner */}
      {seeding && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div className="rounded-lg border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-sm text-primary-300">
            Loaded sample error records so you can explore the dashboard right away.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error ? (
          <div className="card mx-auto max-w-xl p-6 text-center">
            <p className="text-sm text-rose-300">{error}</p>
            <button className="btn-ghost mt-4" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        ) : loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400">
              <RefreshCw size={18} className="animate-spin" />
              Initializing database...
            </div>
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <Dashboard
                stats={stats}
                categories={categories}
                recent={recent}
                onSelect={openDetail}
              />
            )}
            {tab === "records" && (
              <ErrorTable
                rows={rows}
                total={recordsTotal}
                loading={recordsLoading}
                search={search}
                level={level}
                fromDate={fromDate}
                toDate={toDate}
                page={page}
                pageSize={PAGE_SIZE}
                onSearchChange={setSearch}
                onLevelChange={setLevel}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onPageChange={setPage}
                onSelect={openDetail}
                onDelete={handleDelete}
              />
            )}
            {tab === "reports" && (
              <Reports
                topErrors={topErrors}
                byApplication={byApplication}
                categories={categories}
              />
            )}
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 pt-2 text-center text-xs text-slate-600 sm:px-6">
        Application Error Monitoring System · Real SQL via PGlite (Postgres in your
        browser)
      </footer>

      <LogFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <ErrorDetailModal
        record={detail}
        loading={detailLoading}
        onClose={() => {
          setDetail(null);
        }}
      />
    </div>
  );
}
