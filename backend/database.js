const Database = require('better-sqlite3');
const db = new Database('farewatch.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_code TEXT NOT NULL,
    to_code TEXT NOT NULL,
    UNIQUE(from_code, to_code)
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER REFERENCES routes(id),
    price REAL NOT NULL,
    currency TEXT DEFAULT 'GBP',
    airline TEXT,
    stops INTEGER,
    fetched_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    from_code TEXT NOT NULL,
    to_code TEXT NOT NULL,
    threshold REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Helper functions
function addRoute(from, to) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO routes (from_code, to_code) VALUES (?, ?)
  `);
  stmt.run(from, to);
  return db.prepare('SELECT * FROM routes WHERE from_code = ? AND to_code = ?').get(from, to);
}

function savePrice(from, to, price, currency, airline, stops) {
  const route = addRoute(from, to);
  db.prepare(`
    INSERT INTO price_history (route_id, price, currency, airline, stops)
    VALUES (?, ?, ?, ?, ?)
  `).run(route.id, price, currency, airline, stops);
}

function getPriceHistory(from, to, days = 30) {
  const route = db.prepare('SELECT * FROM routes WHERE from_code = ? AND to_code = ?').get(from, to);
  if (!route) return [];
  return db.prepare(`
    SELECT price, currency, airline, stops, fetched_at as date
    FROM price_history
    WHERE route_id = ?
    AND fetched_at >= datetime('now', '-' || ? || ' days')
    ORDER BY fetched_at ASC
  `).all(route.id, days);
}

function getLowestPrice(from, to) {
  const route = db.prepare('SELECT * FROM routes WHERE from_code = ? AND to_code = ?').get(from, to);
  if (!route) return null;
  return db.prepare(`
    SELECT MIN(price) as lowest FROM price_history WHERE route_id = ?
  `).get(route.id);
}

module.exports = { db, addRoute, savePrice, getPriceHistory, getLowestPrice };