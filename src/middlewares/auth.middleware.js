const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'No autorizado',
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado',
    });
  }
}

function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'No autorizado',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        ok: false,
        message: 'Acceso solo para administradores',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al validar permisos',
    });
  }
}

module.exports = {
  authMiddleware,
  adminOnly,
};