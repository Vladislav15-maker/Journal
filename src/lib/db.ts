
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Use a global variable to hold the connection
// This is necessary to prevent re-creating the connection on every hot-reload in development
declare global {
  var db: NeonHttpDatabase<typeof schema> | undefined;
}

let db: NeonHttpDatabase<typeof schema>;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set in production.');
  }
  const sql = neon(process.env.POSTGRES_URL);
  db = drizzle(sql, { schema });
} else {
  if (!global.db) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set. Please check your .env.local file.');
    }
    const sql = neon(process.env.POSTGRES_URL);
    global.db = drizzle(sql, { schema });
  }
  db = global.db;
}

export { db };
