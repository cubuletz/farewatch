const express = require('express')
const router = express.Router()
const axios = require('axios')
const { savePrice, getPriceHistory, getLowestPrice } = require('../database')

let amadeusToken = null
let tokenExpiry = 0

async function getAmadeusToken() {
  if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken
  const res = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token',
    new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.AMADEUS_API_KEY, client_secret: process.env.AMADEUS_API_SECRET }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  amadeusToken = res.data.access_token
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000
  return amadeusToken
}

router.get('/search', async (req, res) => {
  const { from, to, date } = req.query
  if (!from || !to || !date) return res.status(400).json({ error: 'Missing parameters' })
  try {
    const token = await getAmadeusToken()
    const result = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: { Authorization: `Bearer ${token}` },
      params: { originLocationCode: from, destinationLocationCode: to, departureDate: date, adults: 1, max: 20, currencyCode: 'GBP' }
    })
    const flights = (result.data.data || []).map(offer => {
      const seg = offer.itineraries[0].segments
      const first = seg[0], last = seg[seg.length - 1]
      return {
        airline: first.carrierCode,
        flightNumber: `${first.carrierCode}${first.number}`,
        departure: first.departure.at,
        arrival: last.arrival.at,
        stops: seg.length - 1,
        price: parseFloat(offer.price.grandTotal),
        currency: 'GBP',
      }
    }).sort((a, b) => a.price - b.price)

    if (flights.length > 0) {
      await savePrice(from, to, flights[0].price, 'GBP', flights[0].airline, flights[0].stops)
    }

    res.json({ flights, cheapest: flights[0]?.price || null, count: flights.length })
  } catch (e) {
    console.error('Search error:', e.response?.data || e.message)
    res.status(500).json({ error: 'Search failed', details: e.message })
  }
})

router.get('/history', async (req, res) => {
  const { from, to, days = 365 } = req.query
  try {
    const history = await getPriceHistory(from, to, parseInt(days))
    const lowest = await getLowestPrice(from, to)
    res.json({ history, lowest: lowest?.lowest || null })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
