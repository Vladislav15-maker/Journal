import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// IMPORTANT: Don't forget to create a .env.local file with your POSTGRES_URL

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql, { schema });