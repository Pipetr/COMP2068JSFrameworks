var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Felipe\'s Portfolio' });
});

router.get('/home', function(req, res, next) {
  res.render('index', { title: 'Felipe\'s Portfolio' });
});

/* GET About me page. */
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'About Me' });
});

/* GET Projects page. */
router.get('/projects', function(req, res, next) {
  res.render('projects', { title: 'Projects' });
});

/* GET Contact page. */
router.get('/contact', function(req, res, next) {
  res.render('contact', { 
    title: 'Contact',
    isContactPage: true,
  });
});

module.exports = router;
