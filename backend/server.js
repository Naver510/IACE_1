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
  let data;
  switch (req.params.sensorID) {
    case '1':
      data = [
        { timestamp: 1746296389, value: 30.1 },
        { timestamp: 1746296390, value: 30.5 },
        { timestamp: 1746296391, value: 31.1 },
        { timestamp: 1746296392, value: 32.0 },
        { timestamp: 1746296393, value: 32.2 },
        { timestamp: 1746296394, value: 32.5 },
        { timestamp: 1746296395, value: 32.9 },
        { timestamp: 1746296396, value: 40 },
        { timestamp: 1746296397, value: 31.9 },
        { timestamp: 1746296398, value: 31.5 },
        { timestamp: 1746296399, value: 30.1 }
      ];
      break;
    case '2': data = [
      { timestamp: 1746296389, value: 0 },
      { timestamp: 1746296390, value: 243 },
      { timestamp: 1746296391, value: 589 },
      { timestamp: 1746296392, value: 699 },
      { timestamp: 1746296393, value: 700 },
      { timestamp: 1746296394, value: 699 },
      { timestamp: 1746296395, value: 500 },
      { timestamp: 1746296396, value: 300 },
      { timestamp: 1746296397, value: 320 },
      { timestamp: 1746296398, value: 310 },
      { timestamp: 1746296399, value: 310 }
    ];
      break;
    case '3': data = [
      { timestamp: 1746296389, value: 900 },
      { timestamp: 1746296390, value: 910 },
      { timestamp: 1746296391, value: 905 },
      { timestamp: 1746296392, value: 906 },
      { timestamp: 1746296393, value: 908 },
      { timestamp: 1746296394, value: 910 },
      { timestamp: 1746296395, value: 920 },
      { timestamp: 1746296396, value: 925 },
      { timestamp: 1746296397, value: 930 },
      { timestamp: 1746296398, value: 925 },
      { timestamp: 1746296399, value: 920 }
    ];
      break;
    case '4': data = [
      { timestamp: 1746296389, value: 40 },
      { timestamp: 1746296390, value: 42 },
      { timestamp: 1746296391, value: 46 },
      { timestamp: 1746296392, value: 45 },
      { timestamp: 1746296393, value: 44 },
      { timestamp: 1746296394, value: 50 },
      { timestamp: 1746296395, value: 51 },
      { timestamp: 1746296396, value: 52 },
      { timestamp: 1746296397, value: 50 },
      { timestamp: 1746296398, value: 49 },
      { timestamp: 1746296399, value: 48 }
    ];
      break;
    default:
      break;
  }

  res.end(JSON.stringify(data));
});

app.post('/sensor/:sensorAPIkey/reading', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
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