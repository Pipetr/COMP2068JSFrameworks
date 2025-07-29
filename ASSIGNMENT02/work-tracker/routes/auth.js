const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Registration page
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('auth/register', {
    title: 'Register - Work Tracker',
    error: req.session.error,
    success: req.session.success,
    githubEnabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
  });
  delete req.session.error;
  delete req.session.success;
});

// Handle registration
router.post('/register', redirectIfAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      req.session.error = 'All fields are required';
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.session.error = 'Passwords do not match';
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.session.error = 'Password must be at least 6 characters long';
      return res.redirect('/auth/register');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.session.error = 'Email already registered';
      return res.redirect('/auth/register');
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password
    });

    await newUser.save();

    req.session.success = 'Registration successful! Please log in.';
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.session.error = 'An error occurred during registration';
    res.redirect('/auth/register');
  }
});

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Login - Work Tracker',
    error: req.session.error,
    success: req.session.success,
    githubEnabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
  });
  delete req.session.error;
  delete req.session.success;
});

// Handle login
router.post('/login', redirectIfAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      req.session.error = 'An error occurred during login';
      return res.redirect('/auth/login');
    }

    if (!user) {
      req.session.error = info.message || 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Login session error:', err);
        req.session.error = 'An error occurred during login';
        return res.redirect('/auth/login');
      }

      req.session.success = `Welcome back, ${user.firstName}!`;
      const redirectTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      return res.redirect(redirectTo);
    });
  })(req, res, next);
});

// GitHub OAuth
router.get('/github', (req, res, next) => {
  // Check if GitHub strategy is configured
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    req.session.error = 'GitHub OAuth is not configured';
    return res.redirect('/auth/login');
  }
  
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

// GitHub OAuth callback
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

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.redirect('/');
    });
  });
});

module.exports = router;
