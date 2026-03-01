const express = require('express');
const axios = require('axios');
const { savePrice, getPriceHistory, getLowestPrice } = require('../database');
const router = express.Router();

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

// GET /api/flights/search?from=LHR&to=JFK&date=2026-04-15
router.get('/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({ error: 'Missing from, to, or date parameter' });
    }

    const token = await getToken();

    const response = await axios.get(
      'https://test.api.amadeus.com/v2/shopping/flight-offers',
      {
        params: {
          originLocationCode: from,
          destinationLocationCode: to,
          departureDate: date,
          adults: 1,
          max: 5,
          currencyCode: 'GBP',
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const offers = response.data.data;

    if (!offers || offers.length === 0) {
      return res.status(404).json({ error: 'No flights found' });
    }

    const flights = offers
      .sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))
      .map(offer => ({
        price: parseFloat(offer.price.total),
        currency: 'GBP',
        airline: offer.validatingAirlineCodes?.[0],
        stops: offer.itineraries[0].segments.length - 1,
        departure: offer.itineraries[0].segments[0].departure.at,
        arrival: offer.itineraries[0].segments.slice(-1)[0].arrival.at,
      }));

    // ✅ Save cheapest price to database
    const cheapest = flights[0];
    savePrice(from, to, cheapest.price, cheapest.currency, cheapest.airline, cheapest.stops);
    console.log(`💾 Saved: ${from}→${to} £${cheapest.price}`);

    res.json({ from, to, date, cheapest: cheapest.price, flights });

  } catch (error) {
    console.error('Amadeus error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch flight prices' });
  }
});

// GET /api/flights/history?from=LHR&to=JFK&days=30
router.get('/history', (req, res) => {
  const { from, to, days = 365 } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'Missing from or to' });

  const history = getPriceHistory(from, to, days);
  const lowest = getLowestPrice(from, to);

  res.json({ from, to, history, lowest: lowest?.lowest ?? null });
});

module.exports = router;