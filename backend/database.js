const path = require('path')
const fs = require('fs')

// Use better-sqlite3 locally, fall back to sql.js on Render
let db

function initDB() {
  try {
    const Database = require('better-sqlite3')
    const dbPath = path.join(__dirname, 'farewatch.db')
    db = new Database(dbPath)
    console.log('Using better-sqlite3')
    setupSchema()
  } catch (e) {
    console.log('better-sqlite3 failed, using sql.js:', e.message)
    initSqlJs()
  }
}

function initSqlJs() {
  const initSqlJsLib = require('sql.js')
  const dbPath = path.join(__dirname, 'farewatch.db')
  
  initSqlJsLib().then(SQL => {
    let dbData
    try {
      dbData = fs.readFileSync(dbPath)
    } catch (e) {
      dbData = null
    }
    
    const sqlDb = dbData ? new SQL.Database(dbData) : new SQL.Database()
    
    // Wrap sql.js to match better-sqlite3 API
    db = {
      prepare: (sql) => ({
        run: (...params) => {
          sqlDb.run(sql, params)
          saveDb(sqlDb, dbPath)
          return { lastInsertRowid: sqlDb.exec('SELECT last_insert_rowid()')[0]?.values[0][0] }
        },
        get: (...params) => {
          const res = sqlDb.exec(sql, params)
          if (!res[0]) return undefined
          const cols = res[0].columns
          const row = res[0].values[0]
          if (!row) return undefined
          return Object.fromEntries(cols.map((c, i) => [c, row[i]]))
        },
        all: (...params) => {
          const res = sqlDb.exec(sql, params)
          if (!res[0]) return []
          const cols = res[0].columns
          return res[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])))
        }
      }),
      exec: (sql) => { sqlDb.run(sql); saveDb(sqlDb, dbPath) }
    }
    
    console.log('Using sql.js')
    setupSchema()
  })
}

function saveDb(sqlDb, dbPath) {
  try {
    const data = sqlDb.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  } catch (e) {}
}

function setupSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_code TEXT NOT NULL,
      to_code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_code, to_code)
    );
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'GBP',
      airline TEXT,
      stops INTEGER DEFAULT 0,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_code TEXT NOT NULL,
      to_code TEXT NOT NULL,
      email TEXT NOT NULL,
      threshold REAL,
      target_percent REAL,
      alert_type TEXT DEFAULT 'price',
      is_active INTEGER DEFAULT 1,
      last_sent DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  console.log('✅ Database schema ready')
}

function savePrice(from, to, price, currency, airline, stops) {
  try {
    db.prepare('INSERT OR IGNORE INTO routes (from_code, to_code) VALUES (?, ?)').run(from, to)
    const route = db.prepare('SELECT id FROM routes WHERE from_code = ? AND to_code = ?').get(from, to)
    if (route) {
      db.prepare('INSERT INTO price_history (route_id, price, currency, airline, stops) VALUES (?, ?, ?, ?, ?)').run(route.id, price, currency, airline, stops)
    }
  } catch (e) {
    console.error('savePrice error:', e.message)
  }
}

function getPriceHistory(from, to, days = 365) {
  try {
    return db.prepare(`
      SELECT ph.price, ph.airline, ph.fetched_at
      FROM price_history ph
      JOIN routes r ON ph.route_id = r.id
      WHERE r.from_code = ? AND r.to_code = ?
      AND ph.fetched_at >= datetime('now', '-' || ? || ' days')
      ORDER BY ph.fetched_at ASC
    `).all(from, to, days)
  } catch (e) {
    return []
  }
}

function getLowestPrice(from, to) {
  try {
    return db.prepare(`
      SELECT MIN(ph.price) as lowest
      FROM price_history ph
      JOIN routes r ON ph.route_id = r.id
      WHERE r.from_code = ? AND r.to_code = ?
    `).get(from, to)
  } catch (e) {
    return null
  }
}

initDB()

module.exports = { get db() { return db }, savePrice, getPriceHistory, getLowestPrice }
