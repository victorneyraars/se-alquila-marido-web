/**
 * Endpoint de Astro: POST /api/reservas
 * Flujo: Auth Google -> Buscar/Crear Vehículo -> Crear Turno
 */
export const POST = async ({ request, locals }) => {
  const apiUrl =
    locals?.runtime?.env?.PUBLIC_API_URL ||
    'https://api-dev.baqueanonatales.com';
  const prestadorSlug = 'se-alquila-marido';

  try {
    const body = await request.json();

    // 1. Autenticar con Google
    const authRes = await fetch(`${apiUrl}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: body.id_token }),
    });
    if (!authRes.ok) {
      return json({ error: 'Auth con Google falló' }, 401);
    }
    const authData = await authRes.json();
    const accessToken = authData.access_token;

    // 2. Obtener prestador (para tener su ID y servicios)
    const prestadorRes = await fetch(`${apiUrl}/api/v1/prestadores/${prestadorSlug}`, {
      headers: { Accept: 'application/json' },
    });
    if (!prestadorRes.ok) return json({ error: 'Prestador no encontrado' }, 500);
    const prestador = await prestadorRes.json();

    // 3. Buscar si el vehículo ya existe por patente
    const patenteClean = body.patente.toUpperCase().trim();
    let objeto_servicio_id = null;

    const misVehiculosRes = await fetch(`${apiUrl}/api/v1/mis-vehiculos`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (misVehiculosRes.ok) {
      const vehiculos = await misVehiculosRes.json();
      const existente = vehiculos.find((v) => v.patente === patenteClean);
      if (existente) {
        objeto_servicio_id = existente.objeto_servicio_id;
      }
    }

    // 4. Si no existe, crear el vehículo
    if (!objeto_servicio_id) {
      const nuevoVehiculoRes = await fetch(`${apiUrl}/api/v1/mis-vehiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          patente: patenteClean,
          marca: body.marca || 'Desconocida',
          modelo: body.modelo || 'Desconocido',
          anio: parseInt(body.anio, 10) || new Date().getFullYear(),
          tipo_vehiculo: 'otro', // El form web no pide tipo
        }),
      });
      if (!nuevoVehiculoRes.ok) {
        const err = await nuevoVehiculoRes.text();
        return json({ error: `Error al crear vehículo: ${err}` }, 500);
      }
      const nuevoVehiculo = await nuevoVehiculoRes.json();
      objeto_servicio_id = nuevoVehiculo.objeto_servicio_id;
    }

    // 5. Determinar la duración según el servicio elegido en el form
    const servicios = prestador.servicios || [];
    const MAPEO = { mantenimiento: 'Mantenimiento', frenos: 'Frenos', motor: 'Motor', diagnostico: 'Motor' };
    const catBuscada = MAPEO[body.servicio];
    const servicioElegido = catBuscada ? servicios.find((s) => s.categoria_servicio === catBuscada) : servicios[0];
    const duracion = servicioElegido?.duracion_estimada_min || 30;

    // 6. Crear el turno
    const turnoRes = await fetch(`${apiUrl}/api/v1/mis-turnos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        prestador_id: prestador.id,
        objeto_servicio_id: objeto_servicio_id,
        fecha_inicio: new Date(body.fecha_inicio).toISOString(),
        duracion_min: duracion,
        motivo: body.motivo || 'Reserva web',
        notas_cliente: `Servicio solicitado: ${body.servicio}`,
      }),
    });

    if (!turnoRes.ok) {
      const errText = await turnoRes.text();
      return json({ error: `Error al crear turno: ${errText}` }, 500);
    }

    return json({ success: true }, 201);
  } catch (e) {
    return json({ error: e.message || 'Error interno' }, 500);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
