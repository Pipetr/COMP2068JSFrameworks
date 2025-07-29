var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  // If user is authenticated, redirect to dashboard
  if (req.isAuthenticated()) {
    return res.redirect('/work/dashboard');
  }
  
  res.render('index', { 
    title: 'Work Tracker - Professional Time Management',
    subtitle: 'Track your work hours and manage your projects efficiently'
  });
});

// Redirect /dashboard to work dashboard for convenience
router.get('/dashboard', function(req, res, next) {
  res.redirect('/work/dashboard');
});

// GitHub OAuth callback (alternative route to match GitHub app settings)
router.get('/github/callback', (req, res, next) => {
  // Check if GitHub strategy is configured
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    req.session.error = 'GitHub OAuth is not configured';
    return res.redirect('/auth/login');
  }
  
  passport.authenticate('github', { failureRedirect: '/auth/login' })(req, res, next);
}, (req, res) => {
  req.session.success = `Welcome, ${req.user.firstName}!`;
  const redirectTo = req.session.returnTo || '/dashboard';
  delete req.session.returnTo;
  res.redirect(redirectTo);
});

module.exports = router;
