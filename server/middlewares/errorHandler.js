function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'שגיאה פנימית בשרת';
  
  const errorDetails = process.env.NODE_ENV === 'development' ? { ...err, message: undefined } : undefined;

  res.status(status).json({
    success: false,
    message,
    error: errorDetails,
    field: err.field, 
    errorType: err.errorType,
  });
}

module.exports = errorHandler;