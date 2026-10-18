export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    const body = new URLSearchParams(raw);

    const nombre = body.get('nombre')?.trim();
    const email = body.get('email')?.trim();
    const telefono = body.get('telefono')?.trim();
    const mensaje = body.get('mensaje')?.trim();

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return res.status(500).json({ error: 'Config error' });
    }

    // HTML simple, sin títulos grandes ni negritas agresivas
    const htmlBody = `Hola Víctor,

Te llegó una nueva consulta desde la web.

Nombre: ${nombre}
Email: ${email}${telefono ? `\nTeléfono: ${telefono}` : ''}

Mensaje:
${mensaje}

---
Podés responder directo a este mail para contactar a ${nombre}.
`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Víctor - Se Alquila Marido <contacto@sealquilamarido.com>',
        to: ['victorneyraars@gmail.com'],
        subject: `Consulta de ${nombre}`,
        reply_to: email,
        text: htmlBody,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Mail failed' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Contact error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
