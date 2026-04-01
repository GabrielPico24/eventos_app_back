const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1m',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};