export default async function handler(req, res) {
  const API_KEY = process.env.AIRTABLE_API_KEY;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE = 'AppData';
  const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`;
  const HEADERS = { Authorization: `Bearer ${API_KEY}` };

  if (req.method === 'GET') {
    const { key } = req.query;
    const url = `${BASE_URL}?filterByFormula=({Key}="${key}")`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();
    const value = data.records?.[0]?.fields?.Value || null;
    return res.json({ value });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;

    // Find existing record for this key
    const findRes = await fetch(
      `${BASE_URL}?filterByFormula=({Key}="${key}")`,
      { headers: HEADERS }
    );
    const findData = await findRes.json();
    const existing = findData.records?.[0];

    if (existing) {
      // Update existing record
      await fetch(`${BASE_URL}/${existing.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Value: value } })
      });
    } else {
      // Create new record
      await fetch(BASE_URL, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Key: key, Value: value } })
      });
    }

    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
