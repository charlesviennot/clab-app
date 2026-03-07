import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'No refresh token provided' });
  }

  try {
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: "205697",
      client_secret: "3f263edce5e593f80df1a9ce6e822bb7d847f8a0",
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    });

    const { access_token, refresh_token: new_refresh_token, expires_at } = tokenResponse.data;

    res.status(200).json({
      accessToken: access_token,
      refreshToken: new_refresh_token,
      expiresAt: expires_at
    });
  } catch (error: any) {
    console.error('Strava Token Refresh Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token Refresh Failed', details: error.message });
  }
}
