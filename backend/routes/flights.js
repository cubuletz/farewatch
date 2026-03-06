const express = require('express')
const router = express.Router()
const axios = require('axios')
const { savePrice, getPriceHistory } = require('../database')

async function scrapeGoogleFlights(from, to, date, adults = 1, children = 0) {
  const url = `https://www.google.com/travel/flights?q=Flights+from+${from}+to+${to}+on+${date}&hl=en&curr=GBP`
  
  const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
    params: {
      api_key: process.env.SCRAPINGBEE_API_KEY,
      url: url,
      render_js: true,
      wait: 3000,
      extract_rules: JSON.stringify({
        prices: {
          selector: '[data-gs]',
          type: 'list',
          output: {
            price: '[data-gs] span[aria-label*="pound"]',
            airline: '.sSHqwe',
            departure: '[data-gs] span[aria-label*="Departure"]',
            arrival: '[data-gs] span[aria-label*="Arrival"]',
          }
        }
      })
    }
  })
  
  return response.data
}

router.get('/search', async (req, res) => {
  const { from, to, date, adults = 1, children = 0 } = req.query
  if (!from || !to || !date) return res.status(400).json({ error: 'Missing params' })
  
  try {
    const url = `https://www.google.com/travel/flights?q=Flights+from+${from}+to+${to}+on+${date.replace(/-/g,'')}&hl=en&curr=GBP`
    
    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: process.env.SCRAPINGBEE_API_KEY,
        url: url,
        render_js: 'true',
        wait: 4000,
      },
      timeout: 30000
    })

    const html = response.data
    
    // Parse flights from HTML
    const flights = []
    
    // Match price patterns like £123 or £1,234
    const priceMatches = html.match(/£[\d,]+/g) || []
    const airlinePatterns = html.match(/aria-label="[^"]*airline[^"]*"|class="sSHqwe[^"]*"[^>]*>([^<]+)/gi) || []
    
    // Extract structured data
    const gsMatches = html.match(/data-gs="([^"]+)"/g) || []
    
    const prices = [...new Set(priceMatches)]
      .map(p => parseFloat(p.replace('£','').replace(',','')))
      .filter(p => p > 0 && p < 10000)
      .sort((a,b) => a - b)
      .slice(0, 10)

    if (prices.length === 0) {
      return res.status(404).json({ error: 'No flights found. Try different dates.' })
    }

    const mockFlights = prices.map((price, i) => ({
      price,
      airline: 'Various',
      departure: date + 'T' + ['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00'][i] || '10:00',
      arrival: date + 'T' + ['09:00','11:00','13:00','15:00','17:00','19:00','21:00','23:00'][i] || '13:00',
      stops: 0,
      duration: '3h00m'
    }))

    const cheapest = prices[0]
    await savePrice(from, to, cheapest, 'GBP', 'Various', 0)

    res.json({ flights: mockFlights, cheapest, count: mockFlights.length })
  } catch (e) {
    console.error('ScrapingBee error:', e.message)
    res.status(500).json({ error: e.message })
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
