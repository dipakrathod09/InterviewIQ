/**
 * Multer configuration for resume PDF uploads.
 *
 * - Memory storage: buffer parsed directly, no temp files.
 * - 5 MB limit (configurable via MAX_RESUME_SIZE_MB env var).
 * - MIME type pre-filter (Multer checks content-type header).
 * - Magic-byte validation occurs downstream in the controller.
 */
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_MB = parseInt(process.env.MAX_RESUME_SIZE_MB || '5', 10);
const MAX_BYTES = MAX_MB * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new ApiError(400, 'Only PDF files are accepted for resume upload'));
  }
  cb(null, true);
};

export const resumeUpload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
});

/**
 * Express error handler for Multer-specific errors.
 * Converts Multer codes to clean ApiError-compatible JSON responses
 * so the errorHandler middleware can handle them uniformly.
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        message: `Resume PDF must be smaller than ${MAX_MB} MB`,
      });
    }
    return res.status(400).json({
      success: false,
      code: 'UPLOAD_ERROR',
      message: err.message,
    });
  }
  next(err);
};
