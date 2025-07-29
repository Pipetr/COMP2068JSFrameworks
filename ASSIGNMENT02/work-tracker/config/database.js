require('dotenv').config();

const config = {
  development: {
    database: process.env.MONGODB_URI || 'mongodb://localhost:27017/work-tracker',
    secret: process.env.SESSION_SECRET || 'your-secret-key-here'
  },
  production: {
    database: process.env.MONGODB_URI,
    secret: process.env.SESSION_SECRET
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
