const cron = require('node-cron')
const axios = require('axios')
const { savePrice, getPriceHistory } = require('./database')
const { checkAlerts } = require('./routes/alerts')

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

async function fetchPriceForRoute(from, to) {
  try {
    const token = await getAmadeusToken()
    const date = new Date()
    date.setDate(date.getDate() + 30)
    const dateStr = date.toISOString().split('T')[0]
    const res = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: { Authorization: `Bearer ${token}` },
      params: { originLocationCode: from, destinationLocationCode: to, departureDate: dateStr, adults: 1, max: 5, currencyCode: 'GBP' }
    })
    const offers = res.data.data || []
    if (offers.length > 0) {
      const cheapest = offers[0]
      const seg = cheapest.itineraries[0].segments
      await savePrice(from, to, parseFloat(cheapest.price.grandTotal), 'GBP', seg[0].carrierCode, seg.length - 1)
      console.log(`✅ Price saved for ${from}→${to}: £${cheapest.price.grandTotal}`)
    }
  } catch (e) {
    console.error(`❌ Price fetch failed for ${from}→${to}:`, e.message)
  }
}

async function fetchAllRoutes() {
  const defaultRoutes = [
    { from: 'LHR', to: 'JFK' },
    { from: 'LGW', to: 'AGP' },
    { from: 'LTN', to: 'SCV' },
  ]
  console.log('🔄 Auto-fetching prices for all tracked routes...')
  for (const route of defaultRoutes) {
    await fetchPriceForRoute(route.from, route.to)
  }
}

function startScheduler() {
  console.log('⏰ Scheduler started — prices will auto-fetch every 6 hours')
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Running scheduled price fetch...')
    await fetchAllRoutes()
    await checkAlerts()
  })
  // Initial fetch on startup
  fetchAllRoutes().catch(console.error)
}

module.exports = { startScheduler, fetchAllRoutes }

