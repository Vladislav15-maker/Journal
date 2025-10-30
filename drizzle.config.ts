require('dotenv').config({ path: '.env.local' });

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
};
