import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2"; 
import dotenv from 'dotenv';
import User from "../models/User.js"; 

dotenv.config();


passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        console.log(user);
        if (!user) {
          
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName || profile.username,
            profileImage: profile.photos[0].value,
            profileUrl: profile.profileUrl,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});