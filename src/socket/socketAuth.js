const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function socketAuth(socket, next) {
  try {
    console.log('🟠 socketAuth ejecutándose');

    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    console.log('🟠 Token recibido en socket:', token ? 'SÍ' : 'NO');

    if (!token) {
      console.log('❌ Socket sin token');
      return next(new Error('Token requerido'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    console.log('✅ Token socket válido:', decoded);

    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.log('❌ Error en socketAuth:', error.message);
    next(new Error('Token inválido'));
  }
}

module.exports = { socketAuth };