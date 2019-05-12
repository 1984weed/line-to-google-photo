const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const lineRouter = require('./routes/line')
const app = express();
const bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// app.use('/line', lineRouter)
app.get('/health', function (req, res) {
  res.send('ok')
})


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))