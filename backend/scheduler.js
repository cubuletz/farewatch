const cron = require('node-cron')
const axios = require('axios')
const { savePrice } = require('./database')
const { checkAlerts } = require('./routes/alerts')

async function fetchPriceForRoute(from, to) {
  try {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    const dateStr = date.toISOString().split('T')[0]
    
    const res = await axios.get(`${process.env.RENDER_EXTERNAL_URL || 'http://localhost:10000'}/api/flights/search`, {
      params: { from, to, date: dateStr },
      timeout: 30000
    })
    
    if (res.data.cheapest) {
      console.log(`? Price saved for ${from}?${to}: £${res.data.cheapest}`)
    }
  } catch (e) {
    console.error(`? Price fetch failed for ${from}?${to}:`, e.message)
  }
}

async function fetchAllRoutes() {
  const defaultRoutes = [
    { from: 'LHR', to: 'JFK' },
    { from: 'LGW', to: 'AGP' },
    { from: 'LTN', to: 'SCV' },
  ]
  console.log('?? Auto-fetching prices for all tracked routes...')
  for (const route of defaultRoutes) {
    await fetchPriceForRoute(route.from, route.to)
  }
}

function startScheduler() {
  console.log('? Scheduler started — prices will auto-fetch every 6 hours')
  cron.schedule('0 */6 * * *', async () => {
    await fetchAllRoutes()
    await checkAlerts()
  })
  fetchAllRoutes().catch(console.error)
}

module.exports = { startScheduler, fetchAllRoutes }
