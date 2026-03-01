const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const { getAlerts, getAlertsForRoute, saveAlert, deactivateAlert, updateAlertSent, getPriceHistory } = require('../database')

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  })
}

router.post('/alerts', async (req, res) => {
  const { from, to, email, targetPrice, targetPercent, alertType } = req.body
  if (!from || !to || !email) return res.status(400).json({ error: 'Missing fields' })
  try {
    await saveAlert(from, to, email, targetPrice, targetPercent, alertType)
    res.json({ success: true, message: 'Alert saved!' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/alerts', async (req, res) => {
  const { from, to, email } = req.query
  try {
    const alerts = await getAlertsForRoute(from, to, email)
    res.json({ alerts })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/alerts/:id', async (req, res) => {
  try {
    await deactivateAlert(req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/alerts/test-email', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(500).json({ error: 'EMAIL_USER or EMAIL_PASS not set' })
  }
  try {
    await createTransporter().sendMail({
      from: `FareWatch <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FareWatch Test Email',
      html: '<div style="font-family:sans-serif;padding:32px;background:#111128;color:#fff;border-radius:16px"><h1 style="color:#00e5ff">FareWatch</h1><p style="color:#7ecfff">Your email alerts are working!</p></div>'
    })
    res.json({ success: true, message: `Test email sent to ${email}` })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function checkAlerts() {
  try {
    const alerts = await getAlerts()
    for (const alert of alerts) {
      const history = await getPriceHistory(alert.from_code, alert.to_code, 1)
      if (!history.length) continue
      const latest = Math.min(...history.map(h => h.price))
      if ((alert.alert_type === 'price' || alert.alert_type === 'both') && alert.threshold && latest <= alert.threshold) {
        await createTransporter().sendMail({
          from: `FareWatch <${process.env.EMAIL_USER}>`,
          to: alert.email,
          subject: `FareWatch Alert: ${alert.from_code} to ${alert.to_code} - GBP${latest}`,
          html: `<div style="font-family:sans-serif;padding:32px;background:#111128;color:#fff"><h1 style="color:#00e5ff">Price Alert</h1><p>${alert.from_code} to ${alert.to_code}</p><p style="font-size:36px;color:#00e5ff">GBP${latest}</p></div>`
        })
        await updateAlertSent(alert.id)
      }
    }
  } catch (e) { console.error('checkAlerts error:', e.message) }
}

module.exports = { router, checkAlerts }
