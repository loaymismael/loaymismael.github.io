CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  page_path TEXT NOT NULL DEFAULT '/',
  visited_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(country);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_time ON visits(visitor_id, visited_at);

-- One row per browser identifier for the lifetime of the analytics database.
CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL
);
