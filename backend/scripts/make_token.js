require('dotenv').config();
const jwt = require('jsonwebtoken');
const [id, role, email] = process.argv.slice(2);
if (!id || !role || !email) { console.log('Use: node scripts/make-token.js 2 donor donor1@test.local'); process.exit(1); }
if (!process.env.JWT_SECRET) { console.log('JWT_SECRET is missing in backend/.env'); process.exit(1); }
console.log(jwt.sign({ id: Number(id), role, email }, process.env.JWT_SECRET,
{ expiresIn: '2h' }));