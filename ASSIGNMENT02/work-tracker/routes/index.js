var express = require('express');
var router = express.Router();

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

module.exports = router;
