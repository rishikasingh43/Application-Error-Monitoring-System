import { describe, it, expect, beforeAll } from "vitest";
import { ErrorDatabase } from "./db";

// Use in-memory PGlite so tests work without a browser/IndexedDB.
const db = new ErrorDatabase("");

beforeAll(async () => {
  await db.init();
});

describe("ErrorDatabase", () => {
  it("inserts a record and retrieves it", async () => {
    const rec = await db.insert({
      message: "Test message A",
      level: "ERROR",
      application: "test-app",
      module: "unit",
      description: "vitest insert",
      timestamp: new Date().toISOString(),
    });
    expect(rec.id).toBeTruthy();
    const fetched = await db.getById(rec.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.message).toBe("Test message A");
    expect(fetched!.level).toBe("ERROR");
  });

  it("rejects an invalid level via the typed API contract", async () => {
    const invalid = "CRITICAL" as unknown as "ERROR";
    await expect(
      db.insert({
        message: "Bad level",
        level: invalid,
        application: "test-app",
        module: "unit",
        description: "",
        timestamp: new Date().toISOString(),
      })
    ).rejects.toThrow();
  });

  it("filters records by level", async () => {
    const { rows } = await db.list({ level: "INFO", limit: 50 });
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(r.level).toBe("INFO"));
  });

  it("searches by application name", async () => {
    const { rows } = await db.list({
      search: "user-service",
      limit: 50,
    });
    rows.forEach((r) => expect(r.application).toBe("user-service"));
  });

  it("reports dashboard stats that are non-negative", async () => {
    const s = await db.stats();
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.info).toBeGreaterThanOrEqual(0);
    expect(s.warning).toBeGreaterThanOrEqual(0);
    expect(s.error).toBeGreaterThanOrEqual(0);
  });

  it("deletes a record", async () => {
    const rec = await db.insert({
      message: "To be deleted",
      level: "WARNING",
      application: "test-app",
      module: "unit",
      description: "",
      timestamp: new Date().toISOString(),
    });
    const ok = await db.delete(rec.id);
    expect(ok).toBe(true);
    const after = await db.getById(rec.id);
    expect(after).toBeNull();
  });
});
