const jwt = require('jsonwebtoken');
function sendError(res, status, code, message) {
return res.status(status).json({ error: { code, message } });
}
function requireAuth(req, res, next) {
const [scheme, token] = (req.headers.authorization || '').split(' ');
if (scheme !== 'Bearer' || !token) {
return sendError(res, 401, 'UNAUTHORIZED', 'Log in first.');
}
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: payload.sub, role: payload.role };
next();
} catch (error) {
return sendError(res, 401, 'UNAUTHORIZED', 'Your session is invalid or expired.');
}
}
function requireRole(...roles) {
return (req, res, next) => {
if (!req.user || !roles.includes(req.user.role)) {
return sendError(res, 403, 'FORBIDDEN', 'Your role cannot do this.');
}
next();
};
}
module.exports = { requireAuth, requireRole };
