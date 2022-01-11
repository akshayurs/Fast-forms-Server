require('dotenv').config()

const cookieParser = require('cookie-parser')

const express = require('express')
const app = express()
const router = require('./router')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)

const PORT = process.env.PORT || 5000

const rateLimit = require('express-rate-limit')
//limiting 100 requests for 15mins
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

const mongoSanitize = require('express-mongo-sanitize')
app.use(
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(`This request[${key}] is sanitized`, req)
    },
  })
)

app.use(express.json())
app.use(cookieParser())

process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection - ', error)
})

app.use('/', router)

app.listen(PORT, () => console.log(`APP RUNNING ON PORT ${PORT}`))
