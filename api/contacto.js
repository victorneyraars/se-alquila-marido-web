// Vercel Serverless Function (CommonJS, detectada automáticamente por Vercel)
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
    const telefono = body.get('telefono')?.trim() || 'No proporcionado';
    const mensaje = body.get('mensaje')?.trim();

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('RESEND_API_KEY no configurada');
      return res.status(500).json({ error: 'Config error' });
    }

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Contacto Web <contacto@sealquilamarido.com>',
        to: ['victorneyraars@gmail.com'],
        subject: `Nueva consulta web de ${nombre}`,
        reply_to: email,
        html: `<h2>Nueva consulta desde sealquilamarido.com</h2>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${telefono}</p>
          <hr/>
          <p><strong>Mensaje:</strong></p>
          <p>${mensaje.replace(/\n/g, '<br>')}</p>`,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Mail failed' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Contact error:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
