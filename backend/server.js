const express = require('express');
const cors = require('cors');
require('dotenv').config();

const flightsRouter = require('./routes/flights');
const { fetchAllRoutes } = require('./scheduler');
const { router: alertsRouter } = require('./routes/alerts')

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.vercel\.app$/,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
app.use('/api', alertsRouter)
app.use('/api/flights', flightsRouter);

app.get('/', (req, res) => {
  res.json({ status: '✅ FareWatch API is running!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  fetchAllRoutes();
});
