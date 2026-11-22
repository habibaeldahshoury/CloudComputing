require('dotenv').config();
const jwt = require('jsonwebtoken');
const [id, role] = process.argv.slice(2);
if (!id || !role) { console.log('Usage: node make_token.js <user-id> <donor|organizer>'); process.exit(1); }
if (!process.env.JWT_SECRET) { console.log('JWT_SECRET is missing in backend/.env'); process.exit(1); }
console.log(jwt.sign({ sub: id, role }, process.env.JWT_SECRET, { expiresIn: '2h' }));