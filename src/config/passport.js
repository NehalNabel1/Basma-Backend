import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';

import { pool } from './database.js';
import logger from '../utils/logger.js';

const findOrCreateOAuthUser = async ({
  provider,
  providerId,
  email,
  name,
  profilePicture,
}) => {
  const field = provider === 'google' ? 'google_id' : 'facebook_id';

  // Check if user exists by provider ID
  let { rows } = await pool.query(
    `SELECT u.*, c.name AS company_name
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.${field} = $1`,
    [providerId]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // Check if user exists by email
  ({ rows } = await pool.query(
    `SELECT u.*, c.name AS company_name
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.email = $1`,
    [email]
  ));

  if (rows.length > 0) {
    // Link OAuth to existing account
    await pool.query(
      `UPDATE users
       SET ${field} = $1,
           auth_provider = $2,
           profile_image_url = COALESCE(profile_image_url, $3),
           updated_at = NOW()
       WHERE id = $4`,
      [providerId, provider, profilePicture, rows[0].id]
    );

    return {
      ...rows[0],
      [field]: providerId,
    };
  }

  // New OAuth user - needs company registration
  return null;
};

export default function setupPassport(app) {
  app.use(passport.initialize());

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;

            const user = await findOrCreateOAuthUser({
              provider: 'google',
              providerId: profile.id,
              email,
              name: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
            });

            return done(null, {
              ...user,
              oauthProfile: profile,
              provider: 'google',
              email,
            });
          } catch (err) {
            logger.error('Google OAuth error:', err);
            return done(err, null);
          }
        }
      )
    );
  }

  // Facebook Strategy
  if (process.env.FACEBOOK_APP_ID) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const name =
              `${profile.name?.givenName} ${profile.name?.familyName}`.trim();

            const user = await findOrCreateOAuthUser({
              provider: 'facebook',
              providerId: profile.id,
              email,
              name,
              profilePicture: profile.photos?.[0]?.value,
            });

            return done(null, {
              ...user,
              oauthProfile: profile,
              provider: 'facebook',
              email,
              name,
            });
          } catch (err) {
            logger.error('Facebook OAuth error:', err);
            return done(err, null);
          }
        }
      )
    );
  }
}
