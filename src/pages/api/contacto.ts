import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const nombre = data.get('nombre')?.toString().trim();
    const email = data.get('email')?.toString().trim();
    const telefono = data.get('telefono')?.toString().trim() || 'No proporcionado';
    const mensaje = data.get('mensaje')?.toString().trim();

    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtener el token de Resend desde las variables de entorno
    const resendApiKey = import.meta.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY no configurada');
      return new Response(JSON.stringify({ error: 'Error de configuración del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enviar el mail vía Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Contacto Web <contacto@sealquilamarido.com>',
        to: ['victorneyraars@gmail.com'],
        subject: `Nueva consulta web de ${nombre}`,
        reply_to: email,
        html: `
          <h2>Nueva consulta desde sealquilamarido.com</h2>
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${telefono}</p>
          <hr />
          <p><strong>Mensaje:</strong></p>
          <p>${mensaje.replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error de Resend:', errorData);
      return new Response(JSON.stringify({ error: 'Error al enviar el mail' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en el endpoint de contacto:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
