const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const db = require('../database')

// Save an alert
router.post('/alerts', (req, res) => {
  const { from, to, email, targetPrice, targetPercent, alertType } = req.body
  if (!from || !to || !email) return res.status(400).json({ error: 'Missing fields' })
  try {
    db.prepare(`
      INSERT INTO alerts (from_airport, to_airport, email, target_price, target_percent, alert_type, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(from, to, email, targetPrice || null, targetPercent || null, alertType || 'price')
    res.json({ success: true, message: 'Alert saved!' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Get all alerts for a route
router.get('/alerts', (req, res) => {
  const { from, to, email } = req.query
  const alerts = db.prepare(`
    SELECT * FROM alerts WHERE from_airport = ? AND to_airport = ? AND email = ? AND active = 1
  `).all(from, to, email)
  res.json({ alerts })
})

// Delete an alert
router.delete('/alerts/:id', (req, res) => {
  db.prepare('UPDATE alerts SET active = 0 WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// Check and send alerts (called by scheduler)
async function checkAlerts() {
  const alerts = db.prepare('SELECT * FROM alerts WHERE active = 1').all()
  for (const alert of alerts) {
    const latest = db.prepare(`
      SELECT MIN(price) as price FROM price_history 
      WHERE from_airport = ? AND to_airport = ? 
      AND fetched_at >= datetime('now', '-1 day')
    `).get(alert.from_airport, alert.to_airport)
    if (!latest?.price) continue

    let shouldSend = false
    let reason = ''

    if (alert.alert_type === 'price' && alert.target_price && latest.price <= alert.target_price) {
      shouldSend = true
      reason = `Price dropped to £${latest.price} (your target: £${alert.target_price})`
    }
    if (alert.alert_type === 'percent' && alert.target_percent) {
      const history = db.prepare(`
        SELECT price FROM price_history WHERE from_airport = ? AND to_airport = ? ORDER BY fetched_at ASC LIMIT 1
      `).get(alert.from_airport, alert.to_airport)
      if (history) {
        const drop = ((history.price - latest.price) / history.price) * 100
        if (drop >= alert.target_percent) {
          shouldSend = true
          reason = `Price dropped by ${drop.toFixed(1)}% (your target: ${alert.target_percent}%)`
        }
      }
    }
    if (alert.alert_type === 'both') {
      if (alert.target_price && latest.price <= alert.target_price) {
        shouldSend = true
        reason = `Price dropped to £${latest.price} (your target: £${alert.target_price})`
      }
    }

    if (shouldSend) {
      await sendAlertEmail(alert.email, alert.from_airport, alert.to_airport, latest.price, reason)
      // Snooze alert for 24h to avoid spam
      db.prepare('UPDATE alerts SET last_sent = datetime("now") WHERE id = ?').run(alert.id)
    }
  }
}

async function sendAlertEmail(to, from, dest, price, reason) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  })
  await transporter.sendMail({
    from: `FareWatch <${process.env.EMAIL_USER}>`,
    to,
    subject: `✈️ FareWatch Alert: ${from} → ${dest} — £${price}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#060611;color:#fff;padding:32px;border-radius:16px">
        <h1 style="color:#00e5ff;margin:0 0 8px">✈️ FareWatch Alert</h1>
        <p style="color:#7ecfff;font-size:18px;margin:0 0 24px">${from} → ${dest}</p>
        <div style="background:rgba(0,229,255,0.1);border:1px solid #00e5ff44;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0;font-size:14px;color:#7ecfff">Current lowest price</p>
          <p style="margin:4px 0 0;font-size:36px;font-weight:800;color:#00e5ff">£${price}</p>
        </div>
        <p style="color:#aaa;font-size:14px">${reason}</p>
        <a href="https://www.google.com/travel/flights?q=Flights+from+${from}+to+${dest}" 
           style="display:inline-block;background:linear-gradient(135deg,#00e5ff,#0072ff);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;margin-top:16px">
          Search Flights →
        </a>
        <p style="color:#555;font-size:12px;margin-top:24px">FareWatch · <a href="#" style="color:#555">Unsubscribe</a></p>
      </div>
    `
  })
}

module.exports = { router, checkAlerts }
