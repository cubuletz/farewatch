const express = require('express')
const router = express.Router()
const axios = require('axios')
const { savePrice, getPriceHistory } = require('../database')

let amadeusToken = null
let tokenExpiry = 0

async function getToken() {
  if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken
  console.log('Getting Amadeus token, key:', process.env.AMADEUS_API_KEY?.slice(0,8))
  const res = await axios.post(
    'https://test.api.amadeus.com/v1/security/oauth2/token',
    `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  amadeusToken = res.data.access_token
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000
  console.log('Amadeus token obtained successfully')
  return amadeusToken
}

router.get('/search', async (req, res) => {
  const { from, to, date, adults = 1, children = 0 } = req.query
  if (!from || !to || !date) return res.status(400).json({ error: 'Missing params' })
  try {
    const token = await getToken()
    const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      params: { originLocationCode: from, destinationLocationCode: to, departureDate: date, adults, max: 20, currencyCode: 'GBP' },
      headers: { Authorization: `Bearer ${token}` }
    })
    const offers = response.data.data || []
    if (!offers.length) return res.status(404).json({ error: 'No flights found. Try different dates.' })
    const flights = offers.sort((a,b) => parseFloat(a.price.grandTotal) - parseFloat(b.price.grandTotal)).map(offer => ({
      price: parseFloat(offer.price.grandTotal),
      currency: 'GBP',
      airline: offer.validatingAirlineCodes?.[0],
      stops: offer.itineraries[0].segments.length - 1,
      departure: offer.itineraries[0].segments[0].departure.at,
      arrival: offer.itineraries[0].segments.slice(-1)[0].arrival.at,
    }))
    const cheapest = flights[0]
    await savePrice(from, to, cheapest.price, 'GBP', cheapest.airline, cheapest.stops)
    res.json({ from, to, date, cheapest: cheapest.price, flights, count: flights.length })
  } catch (e) {
    console.error('Flight search error:', JSON.stringify(e.response?.data) || e.message)
    res.status(500).json({ error: 'Failed to fetch flight prices' })
  }
})

router.get('/history', async (req, res) => {
  const { from, to, days = 365 } = req.query
  if (!from || !to) return res.status(400).json({ error: 'Missing from or to' })
  try {
    const history = await getPriceHistory(from, to, parseInt(days))
    const prices = history.map(h => h.price)
    res.json({
      history,
      lowest: prices.length ? Math.min(...prices) : null,
      highest: prices.length ? Math.max(...prices) : null,
      average: prices.length ? Math.round(prices.reduce((a,b) => a+b,0) / prices.length) : null
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
