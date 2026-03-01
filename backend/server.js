const express = require('express')
const cors = require('cors')
require('dotenv').config()

const flightsRouter = require('./routes/flights')
const { router: alertsRouter } = require('./routes/alerts')
const { startScheduler } = require('./scheduler')

const app = express()

app.use(cors({
  origin: '*',
  credentials: false,
}))

app.use(express.json())
app.use('/api', alertsRouter)
app.use('/api/flights', flightsRouter)

app.get('/', (req, res) => {
  res.json({ status: 'FareWatch API is running!' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  startScheduler()
})
