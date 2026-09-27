export const validateJwtSecret = (secret, nodeEnv) => {
  const value = secret?.trim();
  if (!value) throw new Error('JWT_SECRET must be explicitly configured');

  const placeholder = /^(supersecretkey.*|your[_-].*|replace[_-].*|change[_-]?me.*|secret|jwt[_-]?secret|development[_-]?secret|test[_-]?secret|placeholder|default)$/i;
  if (nodeEnv === 'production' && (placeholder.test(value) || value.length < 32)) {
    throw new Error('Production JWT_SECRET must be a non-placeholder secret of at least 32 characters');
  }
  return value;
};
