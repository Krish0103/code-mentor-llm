/**
 * Error Handler Middleware
 */

import logger from './logger.js';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle 404 Not Found
 */
export function notFoundHandler(req, res, next) {
  const error = new APIError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Log error
  logger.error(`${statusCode} - ${message}`, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    stack: err.stack
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  }

  if (err.name === 'SyntaxError' && err.status === 400) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Don't leak error details in production
  const response = {
    success: false,
    error: {
      message,
      code: statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation helper
 */
export function validateRequired(data, fields) {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new APIError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      { missingFields: missing }
    );
  }
  
  return true;
}
