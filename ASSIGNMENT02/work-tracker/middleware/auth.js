// Middleware to require authentication
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).render('error', { 
    message: 'Access denied. Admin privileges required.' 
  });
}

// Middleware to redirect authenticated users
function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/work');
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  redirectIfAuthenticated
};
