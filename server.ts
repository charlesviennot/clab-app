import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- STRAVA AUTH ROUTES ---

  // 1. Get Auth URL
  app.get('/api/auth/strava/url', (req, res) => {
    const clientId = process.env.STRAVA_CLIENT_ID;
    
    // Force HTTPS if not localhost
    const protocol = req.get('host')?.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${req.get('host')}/auth/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: "STRAVA_CLIENT_ID not configured" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'activity:read_all,profile:read_all',
      approval_prompt: 'auto'
    });

    const authUrl = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // 2. Callback Handler
  app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.send(`<html><body><h1>Error: ${error}</h1><script>window.close();</script></body></html>`);
    }

    if (!code) {
      return res.send(`<html><body><h1>Error: No code provided</h1><script>window.close();</script></body></html>`);
    }

    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code'
      });

      const { access_token, refresh_token, athlete, expires_at } = tokenResponse.data;

      // Send success message to parent window
      const successHtml = `
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'STRAVA_AUTH_SUCCESS', 
                  payload: { 
                    accessToken: '${access_token}',
                    refreshToken: '${refresh_token}',
                    athlete: ${JSON.stringify(athlete)},
                    expiresAt: ${expires_at}
                  }
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Connexion réussie ! Vous pouvez fermer cette fenêtre.</p>
          </body>
        </html>
      `;
      res.send(successHtml);

    } catch (err: any) {
      console.error('Strava Token Error:', err.response?.data || err.message);
      res.status(500).send(`<html><body><h1>Authentication Failed</h1><p>${err.message}</p></body></html>`);
    }
  });

  // 3. Proxy API Request (to avoid CORS issues)
  app.get('/api/strava/activities', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${token}` },
        params: { per_page: 10 }
      });
      res.json(response.data);
    } catch (err: any) {
      console.error('Strava API Error:', err.response?.data || err.message);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
