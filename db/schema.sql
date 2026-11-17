-- Tabulka pro záznamy návštěv (Cloudflare D1 = SQLite).
-- Spusť jednou v Cloudflare dashboardu: D1 → portfolio-visits → Console.
CREATE TABLE IF NOT EXISTS visits (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      TEXT NOT NULL,              -- čas návštěvy (ISO 8601, UTC)
  url     TEXT NOT NULL,              -- navštívená stránka (bez parametrů)
  ref     TEXT NOT NULL DEFAULT '',   -- odkud návštěvník přišel (referrer)
  ua      TEXT NOT NULL DEFAULT '',   -- prohlížeč (user agent, max. 200 znaků)
  country TEXT NOT NULL DEFAULT ''    -- země podle Cloudflare (např. CZ), žádná IP adresa
);
CREATE INDEX IF NOT EXISTS visits_ts ON visits (ts);
