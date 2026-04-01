const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function socketAuth(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('TOKEN_REQUIRED'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('TOKEN_EXPIRED'));
    }

    return next(new Error('TOKEN_INVALID'));
  }
}

module.exports = { socketAuth };