const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware para autenticar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }

      // Verificar que el usuario existe y está activo
      const userQuery = 'SELECT id, username, email, role, is_active FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      req.user = userResult.rows[0];
      next();
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para autorizar por roles
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
