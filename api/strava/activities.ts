import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 10 }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Strava API Error:', error.response?.data || error.message);
    // Return the actual error details to the client for debugging
    res.status(500).json({ 
      error: "Failed to fetch activities", 
      details: error.response?.data || error.message 
    });
  }
}
