const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { pool } = require('../config/database');

// Schema de validación para login
const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'El nombre de usuario es requerido',
    'any.required': 'El nombre de usuario es requerido'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'La contraseña es requerida',
    'any.required': 'La contraseña es requerida'
  })
});

// Schema de validación para registro
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'El nombre de usuario es requerido',
    'string.min': 'El nombre de usuario debe tener al menos 3 caracteres',
    'string.max': 'El nombre de usuario no puede exceder 50 caracteres',
    'any.required': 'El nombre de usuario es requerido'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'El email debe ser válido',
    'string.empty': 'El email es requerido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'La contraseña es requerida',
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  first_name: Joi.string().required().messages({
    'string.empty': 'El nombre es requerido',
    'any.required': 'El nombre es requerido'
  }),
  last_name: Joi.string().required().messages({
    'string.empty': 'El apellido es requerido',
    'any.required': 'El apellido es requerido'
  }),
  role: Joi.string().valid('admin', 'operator', 'quality', 'lab_technician', 'supervisor').default('operator')
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        details: error.details.map(detail => detail.message)
      });
    }

    const { username, password } = value;

    // Buscar usuario
    const userQuery = 'SELECT id, username, email, password_hash, first_name, last_name, role, is_active FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remover contraseña hash del response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Registro (solo para admin)
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        details: error.details.map(detail => detail.message)
      });
    }

    const { username, email, password, first_name, last_name, role } = value;

    // Verificar si el usuario ya existe
    const existingUserQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const existingUserResult = await pool.query(existingUserQuery, [username, email]);

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario o email ya existe'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const createUserQuery = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, username, email, first_name, last_name, role, is_active, created_at
    `;

    const newUserResult = await pool.query(createUserQuery, [
      username, email, password_hash, first_name, last_name, role
    ]);

    const newUser = newUserResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario o email ya existe'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }

      // Obtener información actualizada del usuario
      const userQuery = 'SELECT id, username, email, first_name, last_name, role, is_active, last_login FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      res.json({
        success: true,
        message: 'Token válido',
        data: userResult.rows[0]
      });
    });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Logout (opcional, ya que JWT es stateless)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

module.exports = router;
