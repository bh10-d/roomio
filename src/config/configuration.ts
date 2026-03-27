export default () => ({
  port: parseInt(process.env.PORT || '3000'),

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  auth: {
    // SECURITY: Do NOT use a fallback default secret. Force explicit JWT_SECRET env var to prevent predictable token signing.
    jwtSecret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is required for auth to work securely. Please set it in .env');
      }
      return secret;
    })(),
    accessTokenTtlSec: parseInt(process.env.ACCESS_TOKEN_TTL_SEC || '900'),
    refreshTokenTtlSec: parseInt(
      process.env.REFRESH_TOKEN_TTL_SEC || '2592000',
    ),
    loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5'),
    loginWindowSec: parseInt(process.env.LOGIN_WINDOW_SEC || '60'),
    lockMinutes: parseInt(process.env.LOGIN_LOCK_MINUTES || '15'),
  },
});
