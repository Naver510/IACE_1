// server.mjs
const { createServer, get } = require('node:http')
const { createConnection } = require('mysql');
const express = require('express')
const config = require('./config.json');
const app = express()

app.use(express.json())


app.get('/sensor/:sensorID/data',(req,res)=>{
  res.setHeader('Content-Type','application/json')
  // TODO: Faktyczne zapytanie do bazy
  res.end(JSON.stringify({values:[{1746296389:30.1},{1746296390:30.5},{1746296391:31.1},{1746296392:32.0},{1746296393:32.2},{1746296394:32.5},{1746296395:32.9},{1746296396:33.2},{1746296397:31.9},{174629638:31.5},{1746296399:30.1}]}))
})
app.post('/sensor/:sensorAPIkey/reading',(req,res)=>{
  res.setHeader('Content-Type','application/json')
  const connection = createConnection(config.db_sensory)
  // TODO: Faktyczne zapytanie do bazy i przetwarzanie
  res.end(JSON.stringify(req.params))
  console.log(JSON.stringify(req.params))
  console.log(req.body)
})

// starts a simple http server locally on port 3000
app.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// run with `node server.mjs`