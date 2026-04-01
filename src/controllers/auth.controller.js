const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');


const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwt');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas',
      });
    }

    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.json({
      ok: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ login error', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor',
    });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        ok: false,
        message: 'Refresh token requerido',
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    });

    return res.json({
      ok: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Refresh token inválido o expirado',
    });
  }
}

module.exports = {
  login,
  refreshToken,
};