require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { registerAdminIfNotExists } = require('./services/auth.service');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  await registerAdminIfNotExists();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();