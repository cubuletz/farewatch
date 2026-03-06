const express = require('express')
const router = express.Router()
const axios = require('axios')
const { savePrice, getPriceHistory } = require('../database')

router.get('/search', async (req, res) => {
  const { from, to, date, adults = 1, children = 0 } = req.query
  if (!from || !to || !date) return res.status(400).json({ error: 'Missing params' })
  
  try {
    const googleUrl = `https://www.google.com/travel/flights?q=Flights+from+${from}+to+${to}+on+${date}&hl=en&curr=GBP`
    
    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: process.env.SCRAPINGBEE_API_KEY,
        url: googleUrl,
        render_js: 'true',
        wait: '4000',
        block_ads: 'true',
        custom_google: 'true',
      },
      timeout: 60000
    })

    const html = response.data
    
    // Extract prices like £123 or £1,234
    const priceMatches = html.match(/£[\d,]+/g) || []
    const prices = [...new Set(priceMatches)]
      .map(p => parseFloat(p.replace('£','').replace(',','')))
      .filter(p => p > 20 && p < 15000)
      .sort((a,b) => a - b)
      .slice(0, 10)

    if (prices.length === 0) {
      return res.status(404).json({ error: 'No flights found. Try different dates.' })
    }

    const flights = prices.map((price, i) => ({
      price,
      airline: 'See Google Flights',
      departure: date + 'T08:00:00',
      arrival: date + 'T11:00:00',
      stops: 0,
      duration: ''
    }))

    const cheapest = prices[0]
    await savePrice(from, to, cheapest, 'GBP', 'Various', 0)

    res.json({ flights, cheapest, count: flights.length })
  } catch (e) {
    console.error('ScrapingBee error:', e.response?.status, e.response?.data || e.message)
    res.status(500).json({ error: e.response?.data || e.message })
  }
})

router.get('/history', async (req, res) => {
  const { from, to, days = 30 } = req.query
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




