exports.requireAuth = (req, res, next) => {
  req.user = { id: '00000000-0000-0000-0000-0000000000b1', role: 'donor' };
  next();
};
exports.requireRole = (requiredRole) => (req, res, next) => {
  if (req.user.role !== requiredRole) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
  }
  next();
};