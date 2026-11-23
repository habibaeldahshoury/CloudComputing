const { neon } = require('@neondatabase/serverless');

module.exports = function sql(strings, ...params) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(process.env.DATABASE_URL)(strings, ...params);
};
