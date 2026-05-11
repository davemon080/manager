import dotenv from 'dotenv';

// Load local manager env first, then parent project env as fallback.
dotenv.config({ path: '.env' });
dotenv.config({ path: '../.env', override: false });

const required = ['DATABASE_URL', 'ADMIN_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = {
  port: Number.parseInt(process.env.PORT || '5050', 10),
  databaseUrl: process.env.DATABASE_URL,
  adminPassword: process.env.ADMIN_PASSWORD
};
