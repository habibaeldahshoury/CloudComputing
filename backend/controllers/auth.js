const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const donorService = require('../services/donorService');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function sendError(res, status, code, message) {
return res.status(status).json({ error: { code, message } });
}
function signToken(user) {
return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
}
async function register(req, res, next) {
try {
if (!req.is('application/json')) {
return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
}
const { email, password, role = 'donor', inviteCode } = req.body;
if (typeof email !== 'string' || !EMAIL_PATTERN.test(email) || email.length > 255) {
return sendError(res, 400, 'VALIDATION_ERROR', 'A valid email is required.');
}
if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
return sendError(res, 400, 'VALIDATION_ERROR', 'Password must be 8 to 72 characters.');
}
if (!['donor', 'organizer'].includes(role)) {
return sendError(res, 400, 'VALIDATION_ERROR', 'role must be donor or organizer.');
}
if (role === 'organizer' && (!process.env.ORGANIZER_INVITE_CODE || inviteCode !== process.env.ORGANIZER_INVITE_CODE)) {
return sendError(res, 403, 'FORBIDDEN', 'A valid invite code is required for organizers.');
}
const passwordHash = await bcrypt.hash(password, 10);
let user;
try {
user = await donorService.createUser(email.trim().toLowerCase(), passwordHash, role);
} catch (error) {
if (error.code === '23505') {
return sendError(res, 409, 'EMAIL_TAKEN', 'This email is already registered.');
}
throw error;
}
res.status(201).json({ token: signToken(user), user });
} catch (error) {
next(error);
}
}
async function login(req, res, next) {
try {
if (!req.is('application/json')) {
return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
}
const { email, password } = req.body;
if (typeof email !== 'string' || typeof password !== 'string') {
return sendError(res, 400, 'VALIDATION_ERROR', 'Email and password are required.');
}
const user = await donorService.findUserByEmail(email.trim().toLowerCase());
const ok = user && await bcrypt.compare(password, user.passwordHash);
if (!ok) {
return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email or password is wrong.');
}
res.status(200).json({ token: signToken(user), user: { id: user.id, email: user.email, role: user.role } });
} catch (error) {
next(error);
}
}
module.exports = { register, login };
