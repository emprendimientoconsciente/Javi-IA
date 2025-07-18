export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  try {
    const response = await fetch(
      'https://ecflowise.emprendimientoconsciente.info/api/v1/prediction/013004ef-002e-4951-baa1-bf9b88fab382',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mWY6mH4ukuYu3QqQnNreAmPuX_SDFEXGVNdDPc4fT7w',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: message })
      }
    );

    const data = await response.json();
    res.status(200).json({ response: data });

  } catch (error) {
    res.status(500).json({ error: 'Error al procesar mensaje' });
  }
}