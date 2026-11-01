import { PGlite } from "@electric-sql/pglite";
import type {
  CategoryCount,
  DashboardStats,
  ErrorLevel,
  ErrorRecord,
  RecentActivity,
  TopError,
} from "./types";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS error_logs (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('INFO','WARNING','ERROR')),
  application TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_application ON error_logs(application);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_message ON error_logs(message);
`;

const SEED_SQL = `
INSERT INTO error_logs (id, message, level, application, module, description, timestamp, created_at) VALUES
('ERR-1001','Failed to connect to database','ERROR','user-service','auth','Connection to Postgres timed out after 5000ms during login flow.','2026-10-28T08:14:32Z','2026-10-28T08:14:32Z'),
('ERR-1002','User session expired','INFO','user-service','session','Session token reached expiry and was refreshed automatically.','2026-10-28T09:02:11Z','2026-10-28T09:02:11Z'),
('ERR-1003','High memory usage detected','WARNING','api-gateway','monitor','Memory consumption reached 82% of the 512MB container limit.','2026-10-28T11:45:09Z','2026-10-28T11:45:09Z'),
('ERR-1004','Payment gateway returned 502','ERROR','payment-service','checkout','Stripe API responded with 502 Bad Gateway while processing order #4821.','2026-10-29T14:20:55Z','2026-10-29T14:20:55Z'),
('ERR-1005','Rate limit exceeded','WARNING','api-gateway','throttle','Client IP exceeded 100 requests per minute and was throttled.','2026-10-29T16:08:40Z','2026-10-29T16:08:40Z'),
('ERR-1006','Failed to connect to database','ERROR','inventory-service','stock','Connection pool exhausted; 20 of 20 connections in use.','2026-10-30T07:31:12Z','2026-10-30T07:31:12Z'),
('ERR-1007','Cache miss for product catalog','INFO','catalog-service','cache','Redis cache miss; falling back to database query for product list.','2026-10-30T10:15:00Z','2026-10-30T10:15:00Z'),
('ERR-1008','Unhandled exception in order processor','ERROR','order-service','processor','NullPointerException thrown while parsing order payload field "shipping_address".','2026-10-30T13:42:48Z','2026-10-30T13:42:48Z'),
('ERR-1009','Deprecated API endpoint called','WARNING','api-gateway','routing','Client called /v1/users which is deprecated; please migrate to /v2/users.','2026-10-31T09:05:21Z','2026-10-31T09:05:21Z'),
('ERR-1010','Failed to connect to database','ERROR','user-service','auth','Connection refused: database host unreachable on port 5432.','2026-10-31T18:59:03Z','2026-10-31T18:59:03Z'),
('ERR-1011','Email notification queue backlog growing','WARNING','notification-service','queue','SMTP queue depth reached 450 messages; normal threshold is 200.','2026-11-01T06:22:14Z','2026-11-01T06:22:14Z'),
('ERR-1012','Feature flag config reloaded','INFO','config-service','flags','Feature flags synchronized successfully from remote config store.','2026-11-01T07:10:00Z','2026-11-01T07:10:00Z')
ON CONFLICT (id) DO NOTHING;
`;

type Row = Record<string, unknown>;

function toErrorRecord(row: Row): ErrorRecord {
  return {
    id: row.id as string,
    message: row.message as string,
    level: row.level as ErrorLevel,
    application: row.application as string,
    module: row.module as string,
    description: (row.description as string) ?? "",
    timestamp: new Date(row.timestamp as string).toISOString(),
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

export class ErrorDatabase {
  private db: PGlite | null = null;
  private ready: Promise<void> | null = null;
  private seedDone = false;
  private readonly dataDir: string;

  constructor(dataDir = "idb://error-monitor-db") {
    this.dataDir = dataDir;
  }

  async init(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        this.db = new PGlite(this.dataDir);
        await this.db.exec(SCHEMA_SQL);
        const exists = await this.db.query(
          `SELECT 1 FROM error_logs WHERE id = 'ERR-1001' LIMIT 1`
        );
        if (!exists.rows.length) {
          await this.db.exec(SEED_SQL);
          this.seedDone = true;
        }
      })();
    }
    return this.ready;
  }

  private async ensure(): Promise<PGlite> {
    await this.init();
    return this.db!;
  }

  wasSeeded(): boolean {
    return this.seedDone;
  }

  async insert(input: {
    message: string;
    level: ErrorLevel;
    application: string;
    module: string;
    description: string;
    timestamp: string;
  }): Promise<ErrorRecord> {
    const db = await this.ensure();
    const id = await this.generateId(db);
    const ts = input.timestamp || new Date().toISOString();
    const res = await db.query(
      `INSERT INTO error_logs (id, message, level, application, module, description, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING id, message, level, application, module, description, timestamp, created_at`,
      [id, input.message, input.level, input.application, input.module, input.description, ts]
    );
    return toErrorRecord(res.rows[0] as Row);
  }

  private async generateId(db: PGlite): Promise<string> {
    const res = await db.query(`SELECT count(*)::int AS total FROM error_logs`);
    const next = ((res.rows[0] as Row).total as number) + 1001;
    const date = new Date();
    const stamp = `${String(date.getUTCFullYear()).slice(-2)}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}${String(date.getUTCSeconds()).padStart(2, "0")}`;
    return `ERR-${stamp}-${next}`;
  }

  async list(params?: {
    search?: string;
    level?: ErrorLevel | "ALL";
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: ErrorRecord[]; total: number }> {
    const db = await this.ensure();
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    const search = params?.search?.trim();
    if (search) {
      conditions.push(
        `(message ILIKE '%' || $${paramIdx} || '%' OR application ILIKE '%' || $${paramIdx} || '%')`
      );
      values.push(search);
      paramIdx++;
    }
    if (params?.level && params.level !== "ALL") {
      conditions.push(`level = $${paramIdx}`);
      values.push(params.level);
      paramIdx++;
    }
    if (params?.fromDate) {
      conditions.push(`timestamp >= $${paramIdx}`);
      values.push(params.fromDate);
      paramIdx++;
    }
    if (params?.toDate) {
      conditions.push(`timestamp <= ($${paramIdx}::date + interval '1 day')`);
      values.push(params.toDate);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = params?.limit ?? 100;
    const offset = params?.offset ?? 0;

    const countRes = await db.query(`SELECT count(*)::int AS total FROM error_logs ${where}`, values);
    const total = (countRes.rows[0] as Row).total as number;

    const dataRes = await db.query(
      `SELECT id, message, level, application, module, description, timestamp, created_at
       FROM error_logs ${where}
       ORDER BY timestamp DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, limit, offset]
    );
    const rows = (dataRes.rows as Row[]).map(toErrorRecord);
    return { rows, total };
  }

  async getById(id: string): Promise<ErrorRecord | null> {
    const db = await this.ensure();
    const res = await db.query(
      `SELECT id, message, level, application, module, description, timestamp, created_at
       FROM error_logs WHERE id = $1`,
      [id]
    );
    if (!res.rows.length) return null;
    return toErrorRecord(res.rows[0] as Row);
  }

  async delete(id: string): Promise<boolean> {
    const db = await this.ensure();
    const res = await db.query(`DELETE FROM error_logs WHERE id = $1`, [id]);
    return (res.affectedRows ?? 0) > 0;
  }

  async stats(): Promise<DashboardStats> {
    const db = await this.ensure();
    const res = await db.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE level = 'INFO')::int AS info,
         count(*) FILTER (WHERE level = 'WARNING')::int AS warning,
         count(*) FILTER (WHERE level = 'ERROR')::int AS error
       FROM error_logs`
    );
    const row = res.rows[0] as Row;
    return {
      total: row.total as number,
      info: row.info as number,
      warning: row.warning as number,
      error: row.error as number,
    };
  }

  async countsByCategory(): Promise<CategoryCount[]> {
    const db = await this.ensure();
    const res = await db.query(
      `SELECT level, count(*)::int AS count FROM error_logs GROUP BY level ORDER BY
         CASE level WHEN 'ERROR' THEN 1 WHEN 'WARNING' THEN 2 WHEN 'INFO' THEN 3 END`
    );
    return (res.rows as Row[]).map((r) => ({
      level: r.level as ErrorLevel,
      count: r.count as number,
    }));
  }

  async topErrors(limit = 5): Promise<TopError[]> {
    const db = await this.ensure();
    const res = await db.query(
      `SELECT message,
              level,
              count(*)::int AS occurrences,
              (array_agg(application ORDER BY created_at DESC))[1] AS application,
              max(timestamp) AS last_seen
       FROM error_logs
       GROUP BY message, level
       ORDER BY occurrences DESC, max(timestamp) DESC
       LIMIT $1`,
      [limit]
    );
    return (res.rows as Row[]).map((r) => ({
      message: r.message as string,
      level: r.level as ErrorLevel,
      occurrences: r.occurrences as number,
      application: r.application as string,
      last_seen: new Date(r.last_seen as string).toISOString(),
    }));
  }

  async recentActivity(limit = 6): Promise<RecentActivity[]> {
    const db = await this.ensure();
    const res = await db.query(
      `SELECT id, message, level, application, timestamp
       FROM error_logs
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );
    return (res.rows as Row[]).map((r) => ({
      id: r.id as string,
      message: r.message as string,
      level: r.level as ErrorLevel,
      application: r.application as string,
      timestamp: new Date(r.timestamp as string).toISOString(),
    }));
  }

  async countByApplication(): Promise<{ application: string; count: number; errors: number }[]> {
    const db = await this.ensure();
    const res = await db.query(
      `SELECT application,
              count(*)::int AS count,
              count(*) FILTER (WHERE level = 'ERROR')::int AS errors
       FROM error_logs
       GROUP BY application
       ORDER BY count DESC`
    );
    return (res.rows as Row[]).map((r) => ({
      application: r.application as string,
      count: r.count as number,
      errors: r.errors as number,
    }));
  }
}
