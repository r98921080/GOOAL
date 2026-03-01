import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database('flex_progress.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    display_name TEXT,
    email TEXT,
    state TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: 'flex-progress-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      httpOnly: true,
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser((id: string, done) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user);
  });

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/google/callback`,
    }, (accessToken, refreshToken, profile, done) => {
      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);
      if (!user) {
        const id = Math.random().toString(36).substr(2, 9);
        db.prepare('INSERT INTO users (id, google_id, display_name, email) VALUES (?, ?, ?, ?)')
          .run(id, profile.id, profile.displayName, profile.emails?.[0].value);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      }
      return done(null, user);
    }));
  }

  // Auth Routes
  app.get('/api/auth/url', (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Google Auth not configured' });
    }
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.APP_URL}/auth/google/callback`,
      response_type: 'code',
      scope: 'profile email',
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  });

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>登入成功，正在關閉視窗...</p>
        </body>
      </html>
    `);
  });

  app.get('/api/me', (req, res) => {
    res.json(req.user || null);
  });

  app.post('/api/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Data Sync Routes
  app.get('/api/state', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user: any = req.user;
    const row = db.prepare('SELECT state FROM users WHERE id = ?').get(user.id);
    res.json(row.state ? JSON.parse(row.state) : null);
  });

  app.post('/api/state', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user: any = req.user;
    db.prepare('UPDATE users SET state = ? WHERE id = ?').run(JSON.stringify(req.body), user.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
