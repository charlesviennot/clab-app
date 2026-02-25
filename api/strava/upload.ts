import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const { name, type, start_date_local, elapsed_time, description } = req.body;

  try {
    const response = await axios.post('https://www.strava.com/api/v3/activities', {
      name,
      type,
      start_date_local,
      elapsed_time,
      description
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(201).json(response.data);
  } catch (error: any) {
    console.error('Strava Upload Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to upload activity", 
      details: error.response?.data || error.message 
    });
  }
}
