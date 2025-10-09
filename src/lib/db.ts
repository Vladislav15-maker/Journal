
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// This check is crucial. It ensures that the app, when running on Vercel or locally via "next dev",
// has access to the database connection string.
if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set. Please check your .env.local file or Vercel environment variables.');
}

const sql = neon(process.env.POSTGRES_URL);

// Use a global variable to hold the connection
// This is necessary to prevent re-creating the connection on every hot-reload in development
declare global {
  var db: NeonHttpDatabase<typeof schema> | undefined;
}

let db: NeonHttpDatabase<typeof schema>;

if (process.env.NODE_ENV === 'production') {
  db = drizzle(sql, { schema });
} else {
  if (!global.db) {
    global.db = drizzle(sql, { schema });
  }
  db = global.db;
}

export { db };
