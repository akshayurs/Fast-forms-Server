require('dotenv').config()

const cookieParser = require('cookie-parser')

const express = require('express')
const app = express()
const router = require('./router')

const cors = require('cors')
app.use(cors())

const mongoose = require('mongoose')

let options = {}
if (process.env.ENVIRONMENT == 'development') {
  options = { family: 4 }
}
mongoose.connect(process.env.MONGO_URI, options)

const PORT = process.env.PORT || 5000

const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: process.env.RATE_LIM_MINS * 60 * 1000,
  max: process.env.RATE_LIM_REQ,
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
  console.log('unhandledRejection -> \n ', error)
})

app.use('/', router)

app.listen(PORT, () => console.log(`APP RUNNING ON PORT ${PORT}`))
