import path from 'path';
import dotenv from 'dotenv';

// Load from current working directory and fallback to parent directory (.env in root)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

// Fail-fast validation: hardcoded secrets are strictly forbidden
if (!accessSecret || !refreshSecret) {
  throw new Error(
    '[FATAL CONFIGURATION ERROR] Missing required environment secrets. JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined in .env. Server startup aborted.'
  );
}

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },
};
