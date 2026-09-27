export class ApiError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}
