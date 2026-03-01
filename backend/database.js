const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function setupSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      from_code TEXT NOT NULL,
      to_code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(from_code, to_code)
    );
    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      route_id INTEGER REFERENCES routes(id),
      price REAL NOT NULL,
      currency TEXT DEFAULT 'GBP',
      airline TEXT,
      stops INTEGER DEFAULT 0,
      fetched_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      from_code TEXT NOT NULL,
      to_code TEXT NOT NULL,
      email TEXT NOT NULL,
      threshold REAL,
      target_percent REAL,
      alert_type TEXT DEFAULT 'price',
      is_active INTEGER DEFAULT 1,
      last_sent TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `)
  console.log('? Database schema ready')
}

setupSchema().catch(console.error)

async function savePrice(from, to, price, currency, airline, stops) {
  try {
    await pool.query('INSERT INTO routes (from_code, to_code) VALUES ($1, $2) ON CONFLICT DO NOTHING', [from, to])
    const { rows } = await pool.query('SELECT id FROM routes WHERE from_code = $1 AND to_code = $2', [from, to])
    if (rows[0]) {
      await pool.query('INSERT INTO price_history (route_id, price, currency, airline, stops) VALUES ($1, $2, $3, $4, $5)', [rows[0].id, price, currency, airline, stops])
    }
  } catch (e) {
    console.error('savePrice error:', e.message)
  }
}

async function getPriceHistory(from, to, days = 365) {
  try {
    const { rows } = await pool.query(`
      SELECT ph.price, ph.airline, ph.fetched_at
      FROM price_history ph
      JOIN routes r ON ph.route_id = r.id
      WHERE r.from_code = $1 AND r.to_code = $2
      AND ph.fetched_at >= NOW() - ($3 || ' days')::INTERVAL
      ORDER BY ph.fetched_at ASC
    `, [from, to, days])
    return rows
  } catch (e) { return [] }
}

async function getLowestPrice(from, to) {
  try {
    const { rows } = await pool.query(`
      SELECT MIN(ph.price) as lowest
      FROM price_history ph
      JOIN routes r ON ph.route_id = r.id
      WHERE r.from_code = $1 AND r.to_code = $2
    `, [from, to])
    return rows[0]
  } catch (e) { return null }
}

async function getAlerts() {
  const { rows } = await pool.query('SELECT * FROM alerts WHERE is_active = 1')
  return rows
}

async function getAlertsForRoute(from, to, email) {
  const { rows } = await pool.query('SELECT * FROM alerts WHERE from_code = $1 AND to_code = $2 AND email = $3 AND is_active = 1', [from, to, email])
  return rows
}

async function saveAlert(from, to, email, targetPrice, targetPercent, alertType) {
  await pool.query(
    'INSERT INTO alerts (from_code, to_code, email, threshold, target_percent, alert_type) VALUES ($1, $2, $3, $4, $5, $6)',
    [from, to, email, targetPrice || null, targetPercent || null, alertType || 'price']
  )
}

async function deactivateAlert(id) {
  await pool.query('UPDATE alerts SET is_active = 0 WHERE id = $1', [id])
}

async function updateAlertSent(id) {
  await pool.query('UPDATE alerts SET last_sent = NOW() WHERE id = $1', [id])
}

module.exports = { pool, savePrice, getPriceHistory, getLowestPrice, getAlerts, getAlertsForRoute, saveAlert, deactivateAlert, updateAlertSent }
