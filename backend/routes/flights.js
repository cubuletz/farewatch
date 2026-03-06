const express = require('express')
const router = express.Router()
const axios = require('axios')
const { savePrice, getPriceHistory } = require('../database')

router.get('/search', async (req, res) => {
  const { from, to, date, adults = 1, children = 0 } = req.query
  if (!from || !to || !date) return res.status(400).json({ error: 'Missing params' })
  try {
    console.log(`Searching flights: ${from} -> ${to} on ${date}`)
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_flights',
        departure_id: from,
        arrival_id: to,
        outbound_date: date,
        currency: 'GBP',
        hl: 'en',
        type: '2',
        adults: adults,
        children: children,
        api_key: process.env.SERPAPI_KEY,
      },
      timeout: 30000
    })

    const data = response.data
    const bestFlights = data.best_flights || []
    const otherFlights = data.other_flights || []
    const allFlights = [...bestFlights, ...otherFlights]

    if (!allFlights.length) {
      return res.status(404).json({ error: 'No flights found. Try different dates.' })
    }

    const flights = allFlights.map(f => {
      const leg = f.flights?.[0]
      return {
        price: f.price,
        currency: 'GBP',
        airline: leg?.airline || 'Unknown',
        airline_logo: leg?.airline_logo || null,
        stops: f.flights?.length - 1 || 0,
        departure: leg?.departure_airport?.time || date + ' 00:00',
        arrival: f.flights?.slice(-1)[0]?.arrival_airport?.time || date + ' 00:00',
        duration: f.total_duration,
        flight_number: leg?.flight_number || '',
        booking_token: f.booking_token || null,
        booking_link: f.booking_options?.[0]?.book_with_data?.[0]?.book_with_link || null,
      }
    }).sort((a, b) => a.price - b.price)

    const cheapest = flights[0].price
    await savePrice(from, to, cheapest, 'GBP', flights[0].airline, flights[0].stops)
    console.log(`Found ${flights.length} flights, cheapest: £${cheapest}`)

    res.json({ from, to, date, cheapest, flights, count: flights.length })
  } catch (e) {
    console.error('SerpAPI error:', e.response?.data || e.message)
    res.status(500).json({ error: e.response?.data?.error || e.message })
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





