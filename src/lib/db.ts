import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Используем глобальную переменную, чтобы избежать пересоздания соединения при горячей перезагрузке в разработке
declare global {
  var db: NeonHttpDatabase<typeof schema> | undefined;
}

const createDb = (): NeonHttpDatabase<typeof schema> => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set. Please check your .env.local file.');
  }
  const sql = neon(process.env.POSTGRES_URL);
  return drizzle(sql, { schema });
};

const db: NeonHttpDatabase<typeof schema> = global.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export { db };
