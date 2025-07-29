var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MongoStore = require('connect-mongo');
var mongoose = require('mongoose');
var passport = require('passport');
var hbs = require('hbs');

// Load environment variables
require('dotenv').config();

// Import database configuration
const dbConfig = require('./config/database');

// Import passport configuration
require('./config/passport');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var workRouter = require('./routes/work');
var projectsRouter = require('./routes/projects');

var app = express();

// Connect to MongoDB
mongoose.connect(dbConfig.database)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Please ensure MongoDB is running or update your MONGODB_URI in the .env file');
    console.log('Application will continue without database functionality');
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Register handlebars helpers
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

hbs.registerHelper('formatCurrency', function(amount) {
  return '$' + parseFloat(amount || 0).toFixed(2);
});

hbs.registerHelper('formatDate', function(date) {
  // Create date and format it to avoid timezone issues
  const d = new Date(date);
  // Use toISOString and split to get just the date part, then reformat
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

hbs.registerHelper('currentYear', function() {
  return new Date().getFullYear();
});

// Sections helper for page-specific CSS and JS
hbs.registerHelper('section', function(name, options) {
  if (!this._sections) this._sections = {};
  this._sections[name] = options.fn(this);
});

// Register partials directory
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: dbConfig.secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: dbConfig.database
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global middleware to pass user to all templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/work', workRouter);
app.use('/projects', projectsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
