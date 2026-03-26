const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación de Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Error de base de datos PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(400).json({
          success: false,
          message: 'Registro duplicado. El valor ya existe en la base de datos.'
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida. El registro relacionado no existe.'
        });
      case '23502': // Not null violation
        return res.status(400).json({
          success: false,
          message: 'Campo requerido faltante.'
        });
      case '23514': // Check violation
        return res.status(400).json({
          success: false,
          message: 'Violación de restricción. Los datos no cumplen con las reglas definidas.'
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Error en la base de datos.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON malformado en el cuerpo de la solicitud.'
    });
  }

  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Error por defecto
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
