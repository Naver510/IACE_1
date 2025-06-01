// server.mjs
const cors = require('cors');
const { createServer, get } = require('node:http')
const { createConnection } = require('mysql2');
const express = require('express')
const config = require('./config.json');
const { Parser } = require('json2csv');
const app = express()
app.use(cors());

app.use(express.json())


app.get('/sensor/:sensorID/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const connection = createConnection(config.db_sensory)
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      connection.end()
      return;
    }
  });
  connection.query('SELECT ReadingTime, Value FROM reading where SensorKeys_idSensorKeys = ?;', [req.params.sensorID], (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      res.status(500).json({ error: 'Database query error' });
      connection.end()
      return;
    }
    let data = results.map((row) => ({
      timestamp: row.ReadingTime,
      value: parseFloat(row.Value)
    }));
    res.status(200).json(data);
  })
  connection.end()
});

app.get('/sensor/:sensorID/safezone', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const connection = createConnection(config.db_sensory)
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      connection.end()
      return;
    }
  });
  connection.query('SELECT SafeMin, SafeMax FROM saferange WHERE SensorKeys_idSensorKeys = ?;', [req.params.sensorID], (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      res.status(500).json({ error: 'Database query error' });
      connection.end()
      return;
    }
    let data = results.map((row) => ({
      min: parseFloat(row.SafeMin),
      max: parseFloat(row.SafeMax)
    }))
    console.log(data[0])
    res.status(200).json(data[0])
    connection.end()
  })
});

app.post('/sensor/:sensorAPIkey/reading', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  const connection = createConnection(config.db_sensory)
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      res.status(500).json({ error: 'Database connection error' });
      connection.end()
      return;
    }
  });
  connection.query('INSERT INTO reading (SensorKeys_idSensorKeys,Value,ReadingTime) VALUES ((SELECT idSensorKeys FROM sensor.sensorkeys where IdentifierString = ?),?,?);', [req.params.sensorAPIkey, req.body.value, req.body.timestamp], (err, results) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      res.status(500).json({ error: 'Database insertion error' });
      connection.end()
      return;
    }
    res.status(200).json({ message: 'Data inserted successfully' });
  })
  connection.end()
});

app.get('/sensor/:sensorID/export', (req, res) => {
  const format = req.query.format === 'txt' ? 'txt' : 'csv';
  const connection = createConnection(config.db_sensory);
  connection.connect((err) => {
    if (err) {
      res.status(500).send('Database connection error');
      connection.end();
      return;
    }
  });
  connection.query(
    'SELECT ReadingTime, Value FROM reading WHERE SensorKeys_idSensorKeys = ?;',
    [req.params.sensorID],
    (err, results) => {
      if (err) {
        res.status(500).send('Database query error');
        connection.end();
        return;
      }
      if (format === 'csv') {
        const parser = new Parser({ fields: ['ReadingTime', 'Value'] });
        const csv = parser.parse(results);
        res.header('Content-Type', 'text/csv');
        res.attachment(`sensor_${req.params.sensorID}_data.csv`);
        res.send(csv);
      } else {
        let txt = 'Data i czas           | Wartość\n';
        txt += '---------------------|--------\n';
        results.forEach(row => {
          const date = new Date(row.ReadingTime * 1000).toLocaleString();
          txt += `${date.padEnd(21)}| ${row.Value}\n`;
        });
        res.header('Content-Type', 'text/plain');
        res.attachment(`sensor_${req.params.sensorID}_data.txt`);
        res.send(txt);
      }
      connection.end();
    }
  );
});

// starts a simple http server locally on port 3000
app.listen(3000, '127.0.0.1', () => {
  console.log('Listening on 127.0.0.1:3000');
});

// run with `node server.mjs`