const API_URL = process.env.PUBLIC_API_URL || 'https://api-dev.baqueanonatales.com';
const PRESTADOR_SLUG = 'se-alquila-marido';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    const body = JSON.parse(raw);

    const { id_token, marca, modelo, anio, fecha_inicio, motivo } = body;

    if (!id_token || !marca || !modelo || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // 1. Login con Firebase id_token → JWT backend
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.text();
      console.error('Login error:', err);
      return res.status(401).json({ error: 'No se pudo autenticar con Google' });
    }

    const loginData = await loginRes.json();
    const jwt = loginData.access_token || loginData.token;
    if (!jwt) {
      return res.status(500).json({ error: 'No se recibió token' });
    }

    // 2. Obtener prestador_id por slug
    const prestadorRes = await fetch(`${API_URL}/api/v1/prestadores/${PRESTADOR_SLUG}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!prestadorRes.ok) {
      return res.status(500).json({ error: 'Prestador no encontrado' });
    }
    const prestadorData = await prestadorRes.json();
    const prestador_id = prestadorData.id;

    // 3. Crear vehículo (crea objeto_servicio + vehiculo en 1 llamada)
    const vehiculoRes = await fetch(`${API_URL}/api/v1/mis-vehiculos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ marca, modelo, anio: anio ? parseInt(anio) : null }),
    });

    if (!vehiculoRes.ok) {
      const err = await vehiculoRes.text();
      console.error('Vehiculo error:', err);
      return res.status(400).json({ error: 'No se pudo crear el vehículo' });
    }

    const vehiculoData = await vehiculoRes.json();
    const objeto_servicio_id = vehiculoData.objeto_servicio_id || vehiculoData.id;

    // 4. Crear turno
    const turnoRes = await fetch(`${API_URL}/api/v1/mis-turnos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prestador_id,
        objeto_servicio_id,
        fecha_inicio,
        motivo: motivo || 'Reserva desde web',
      }),
    });

    if (!turnoRes.ok) {
      const err = await turnoRes.text();
      console.error('Turno error:', err);
      return res.status(400).json({ error: 'No se pudo crear el turno' });
    }

    const turnoData = await turnoRes.json();
    return res.status(200).json({
      success: true,
      turno_id: turnoData.id,
      mensaje: 'Reserva creada. Te enviamos un email de confirmación.',
    });

  } catch (e) {
    console.error('Reserva error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
