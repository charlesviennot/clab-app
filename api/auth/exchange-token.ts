import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: "205697",
      client_secret: "3f263edce5e593f80df1a9ce6e822bb7d847f8a0",
      code: code,
      grant_type: 'authorization_code'
    });

    res.status(200).json(tokenResponse.data);
  } catch (error: any) {
    console.error('Strava Token Exchange Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication Failed', details: error.message });
  }
}
