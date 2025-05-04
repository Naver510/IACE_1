// server.mjs
const cors = require('cors');
const { createServer, get } = require('node:http')
const { createConnection } = require('mysql');
const express = require('express')
const config = require('./config.json');
const app = express()
app.use(cors());

app.use(express.json())


app.get('/sensor/:sensorID/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  const data = [
    { timestamp: 1746296389, value: 30.1 },
    { timestamp: 1746296390, value: 30.5 },
    { timestamp: 1746296391, value: 31.1 },
    { timestamp: 1746296392, value: 32.0 },
    { timestamp: 1746296393, value: 32.2 },
    { timestamp: 1746296394, value: 32.5 },
    { timestamp: 1746296395, value: 32.9 },
    { timestamp: 1746296396, value: 33.2 },
    { timestamp: 1746296397, value: 31.9 },
    { timestamp: 1746296398, value: 31.5 },
    { timestamp: 1746296399, value: 30.1 }
  ];
  res.end(JSON.stringify(data));
});

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