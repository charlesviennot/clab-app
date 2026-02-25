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
    // Hardcoded for simplicity/debugging as requested
    const clientId = "205697";
    
    // Force HTTPS if not localhost
    const protocol = req.get('host')?.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${req.get('host')}/auth/callback`;
    
    console.log("Generating Auth URL with:", { clientId, redirectUri });

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

  // 2. Exchange Token API (POST)
  app.post('/api/auth/exchange-token', async (req, res) => {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    try {
      console.log("Exchanging code for token via API...");
      const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
        client_id: "205697",
        client_secret: "3f263edce5e593f80df1a9ce6e822bb7d847f8a0",
        code: code,
        grant_type: 'authorization_code'
      });

      const { access_token, refresh_token, athlete, expires_at } = tokenResponse.data;
      
      res.json({
        accessToken: access_token,
        refreshToken: refresh_token,
        athlete,
        expiresAt: expires_at
      });

    } catch (err: any) {
      console.error('Strava Token Exchange Error:', err.response?.data || err.message);
      res.status(500).json({ error: "Authentication Failed", details: err.message });
    }
  });

  // 3. Callback Handler (Lightweight HTML)
  // Serves a simple page to handle the callback without loading the full React app
  app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connexion Strava...</title>
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #334155; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #fc4c02; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .error { color: #ef4444; background: #fee2e2; padding: 1rem; border-radius: 0.5rem; max-width: 80%; text-align: center; }
        </style>
      </head>
      <body>
        <div id="loading">
          <div class="loader"></div>
          <p>Connexion à Strava en cours...</p>
        </div>
        <div id="error" class="error" style="display: none;"></div>

        <script>
          async function handleCallback() {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const error = params.get('error');

            if (error) {
              showError('Erreur Strava: ' + error);
              return;
            }

            if (!code) {
              showError('Code d\\'autorisation manquant.');
              return;
            }

            try {
              const response = await fetch('/api/auth/exchange-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
              });

              if (response.ok) {
                const data = await response.json();
                if (window.opener) {
                  window.opener.postMessage({ type: 'STRAVA_AUTH_SUCCESS', payload: data }, '*');
                  window.close();
                } else {
                  showError('Fenêtre parente introuvable. Vous pouvez fermer cet onglet.');
                }
              } else {
                const errData = await response.json();
                showError('Échec de la connexion: ' + (errData.details || 'Erreur inconnue'));
              }
            } catch (err) {
              showError('Erreur réseau: ' + err.message);
            }
          }

          function showError(msg) {
            document.getElementById('loading').style.display = 'none';
            const errEl = document.getElementById('error');
            errEl.textContent = msg;
            errEl.style.display = 'block';
          }

          handleCallback();
        </script>
      </body>
      </html>
    `;
    res.send(html);
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
