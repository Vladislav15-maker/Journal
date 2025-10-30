
require('dotenv').config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  // Не выбрасываем ошибку, а просто выходим, если это не запуск drizzle-kit
  // Это предотвратит сбой сборки Next.js, если файл будет случайно включен.
  if (!process.argv.some(arg => arg.includes('drizzle-kit'))) {
    module.exports = {};
    return;
  }
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
