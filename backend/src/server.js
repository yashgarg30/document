const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const uploadRoute = require('./routes/upload');
const searchRoute = require('./routes/search');
const config = require('./config');
const socket = require('./socket');

// ensure upload dir
if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO (allow dev ports)
const corsOptions = {
  origin: function(origin, callback) {
    // allow short-circuit for tools like curl (no origin) and localhost dev ports
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    if (!origin || allowed.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const io = socket.init(server, corsOptions);

// MongoDB connection with retry logic
async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 1000,
    });
    console.log('MongoDB connected to:', config.mongoUri);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectMongo, 5000);
  }
}

mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectMongo, 5000);
});

// Initial connection
connectMongo();

app.use('/api/upload', uploadRoute);
app.use('/api/search', searchRoute);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = config.port;
server.listen(port, () => console.log('Server running on port', port));

// expose io to other modules via require('./socket').get()

process.on('SIGINT', () => process.exit(0));
