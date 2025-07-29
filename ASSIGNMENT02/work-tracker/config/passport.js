const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email'
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// GitHub Strategy (only if credentials are provided)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/github/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this GitHub ID
        let user = await User.findOne({ githubId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // Safely get email from profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        // Check if user exists with same email (only if email is available)
        if (email) {
          user = await User.findOne({ email: email.toLowerCase() });
          
          if (user) {
            // Link GitHub account to existing user
            user.githubId = profile.id;
            user.githubUsername = profile.username;
            await user.save();
            return done(null, user);
          }
        }
        
        // Create new user
        user = new User({
          githubId: profile.id,
          githubUsername: profile.username,
          username: profile.username,
          email: email ? email.toLowerCase() : `${profile.username}@github.local`,
          firstName: profile.displayName ? profile.displayName.split(' ')[0] : profile.username,
          lastName: profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : ''
        });
        
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// No need to export passport since this file just configures it
// The configured passport is used via require('passport') in other files
