import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err.message || 'Server Error';
  let code = err.code;
  let details = err.details;
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Request validation failed';
    code = 'VALIDATION_ERROR';
    details = err.issues.map(({ path, message }) => ({ path: path.join('.'), message }));
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'CONFLICT';
  } else if (err.name === 'CastError' || err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
    code = 'VALIDATION_ERROR';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON body';
    code = 'VALIDATION_ERROR';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body too large';
    code = 'PAYLOAD_TOO_LARGE';
  }
  const production = process.env.NODE_ENV === 'production';
  if (production && statusCode >= 500) message = 'Server Error';
  const defaults = { 400: 'VALIDATION_ERROR', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT' };
  res.status(statusCode).json({
    success: false,
    code: typeof code === 'string' && statusCode < 500 ? code : (defaults[statusCode] || 'INTERNAL_ERROR'),
    message,
    ...(details && statusCode < 500 ? { details } : {}),
    ...(!production ? { stack: err.stack } : {}),
  });
};
