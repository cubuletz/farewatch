const cron = require('node-cron');
const axios = require('axios');
const { savePrice, db } = require('./database');

let amadeusToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken;

  const res = await axios.post(
    'https://test.api.amadeus.com/v1/security/oauth2/token',
    `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  amadeusToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return amadeusToken;
}

async function fetchPriceForRoute(from, to, date, token) {
  try {
    const response = await axios.get(
      'https://test.api.amadeus.com/v2/shopping/flight-offers',
      {
        params: {
          originLocationCode: from,
          destinationLocationCode: to,
          departureDate: date,
          adults: 1,
          max: 3,
          currencyCode: 'GBP',
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const offers = response.data.data;
    if (!offers || offers.length === 0) return;

    const cheapest = offers.reduce((min, o) =>
      parseFloat(o.price.total) < parseFloat(min.price.total) ? o : min
    );

    const price = parseFloat(cheapest.price.total);
    const airline = cheapest.validatingAirlineCodes?.[0];
    const stops = cheapest.itineraries[0].segments.length - 1;

    savePrice(from, to, price, 'GBP', airline, stops);
    console.log(`💾 Auto-saved: ${from}→${to} £${price}`);

  } catch (err) {
    console.error(`❌ Failed ${from}→${to}:`, err.response?.data?.errors?.[0]?.detail || err.message);
  }
}

async function fetchAllRoutes() {
  console.log('\n🔄 Auto-fetching prices for all tracked routes...');

  // Get date 30 days from now
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const dateStr = date.toISOString().split('T')[0];

  try {
    const token = await getToken();
    const routes = db.prepare('SELECT * FROM routes').all();

    if (routes.length === 0) {
      console.log('No routes tracked yet.');
      return;
    }

    for (const route of routes) {
      await fetchPriceForRoute(route.from_code, route.to_code, dateStr, token);
      // Small delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('✅ Auto-fetch complete!\n');
  } catch (err) {
    console.error('❌ Auto-fetch failed:', err.message);
  }
}

// Run every 6 hours
cron.schedule('0 */6 * * *', fetchAllRoutes);

console.log('⏰ Scheduler started — prices will auto-fetch every 6 hours');

module.exports = { fetchAllRoutes };