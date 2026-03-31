const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = require('./app');
const { PORT, MONGO_URI } = require('./config/env');
const { registerSocketHandlers } = require('./socket');

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.set('io', io);

registerSocketHandlers(io);

global.io = io;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error conectando MongoDB:', error);
  });