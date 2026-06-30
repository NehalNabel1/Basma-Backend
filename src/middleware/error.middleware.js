import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';

  // Log all errors
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
  });

  // PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'A record with this information already exists';
        if (err.detail?.includes('email')) message = 'Email already in use';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Referenced resource does not exist';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = `Required field missing: ${err.column}`;
        break;
      case '22P02': // invalid_text_representation
        statusCode = 400;
        message = 'Invalid data format';
        break;
      default:
        if (process.env.NODE_ENV === 'production') message = 'Database error';
    }
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10}MB`;
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Too many files uploaded';
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    statusCode = 400;
  }

  // Hide internal details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  const response = {
    success: false,
    message,
  };

  if (err.errors) response.errors = err.errors;
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default { errorHandler, notFoundHandler };
