export default async function handler(req, res) {
  const API_KEY = process.env.AIRTABLE_API_KEY;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE = encodeURIComponent("Goals Tracker");
  const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`;
  const HEADERS = { Authorization: `Bearer ${API_KEY}` };

  // Debug endpoint — remove once working
  if (req.query.debug === 'true') {
    return res.json({
      hasApiKey: !!API_KEY,
      apiKeyPrefix: API_KEY ? API_KEY.substring(0, 15) + '...' : 'NOT SET',
      baseId: BASE_ID || 'NOT SET',
      table: TABLE,
      fullUrl: BASE_URL.replace(API_KEY, '[REDACTED]')
    });
  }

  if (req.method === 'GET') {
    const { key } = req.query;
    const response = await fetch(`${BASE_URL}?filterByFormula=({Key}="${key}")`, { headers: HEADERS });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error });
    const value = data.records?.[0]?.fields?.Value || null;
    return res.json({ value });
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;

    const findRes = await fetch(`${BASE_URL}?filterByFormula=({Key}="${key}")`, { headers: HEADERS });
    const findData = await findRes.json();
    if (findData.error) return res.status(400).json({ error: findData.error, step: 'find' });

    const existing = findData.records?.[0];
    let writeRes;

    if (existing) {
      const r = await fetch(`${BASE_URL}/${existing.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Value: value } })
      });
      writeRes = await r.json();
    } else {
      const r = await fetch(BASE_URL, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { Key: key, Value: value } })
      });
      writeRes = await r.json();
    }

    if (writeRes.error) return res.status(400).json({ success: false, error: writeRes.error, step: 'write' });
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
