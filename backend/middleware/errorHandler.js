const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    message = 'Duplicate entry. This record already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 400;
    message = 'Cannot delete this record because it is referenced by other records.';
  } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
    statusCode = 400;
    message = 'Invalid data format provided.';
  }

  // Database connectivity problems must give a clear message, never crash the app
  const dbDown = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR', 'EAI_AGAIN'];
  if (dbDown.includes(err.code)) {
    statusCode = 503;
    message = 'The database is currently unavailable. Please try again shortly.';
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
    statusCode = 503;
    message = 'The server could not sign in to the database. Check the DB_* values in the .env file.';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.code === 'ER_CONSTRAINT_FAILED' || err.errno === 4025 || err.errno === 3819) {
    statusCode = 400;
    message = 'The request breaks a database rule (for example, stock cannot go below zero).';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // Validation errors (express-validator)
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = err.array().map(e => e.msg).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
