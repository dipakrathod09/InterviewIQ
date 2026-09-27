import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(400, 'Request validation failed', 'VALIDATION_ERROR',
        error.issues.map(({ path, message }) => ({ path: path.join('.'), message }))));
    }
    next(error);
  }
};
