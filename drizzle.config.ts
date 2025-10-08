
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set. Please create a .env.local file with your database connection string.');
}

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
} satisfies Config;
