const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
function limitAuth(req, res, next) {
const now = Date.now();
const entry = attempts.get(req.ip);
if (!entry || now - entry.start > WINDOW_MS) {
attempts.set(req.ip, { start: now, count: 1 });
return next();
}
entry.count += 1;
if (entry.count > MAX_ATTEMPTS) {
res.set('Retry-After', String(Math.ceil((entry.start + WINDOW_MS - now) / 1000)));
return res.status(429).json({ error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Try again later.' } });
}
next();
}
module.exports = { limitAuth };
