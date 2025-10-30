
require('dotenv').config({ path: '.env.local' });

// This check prevents the file from being processed during `next build`
// where the environment variable is not expected to be set.
if (!process.env.POSTGRES_URL) {
  // If not running via drizzle-kit, just return an empty object
  if (!process.argv.some(arg => arg.includes('drizzle-kit'))) {
    module.exports = {};
    return;
  }
  // If running via drizzle-kit, it's a real error
  throw new Error('POSTGRES_URL is not set in .env.local');
}

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
};
