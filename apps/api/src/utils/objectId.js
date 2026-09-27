import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export const assertObjectId = (value, name = 'id') => {
  if (!mongoose.isObjectIdOrHexString(value)) {
    throw new ApiError(400, `Invalid ${name}`, 'VALIDATION_ERROR', [
      { path: name, message: 'Must be a 24-character hexadecimal ObjectId' },
    ]);
  }
};
