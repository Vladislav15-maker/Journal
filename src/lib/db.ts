
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// This check is crucial. It ensures that the app, when running on Vercel or locally via "next dev",
// has access to the database connection string.
if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set. Please check your .env.local file or Vercel environment variables.');
}

const sql = neon(process.env.POSTGRES_URL);

export const db = drizzle(sql, { schema });
