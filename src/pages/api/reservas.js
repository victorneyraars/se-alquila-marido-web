/**
 * Endpoint de Astro: POST /api/reservas
 *
 * Recibe los datos del form de reserva, autentica con Google (id_token),
 * mapea el servicio elegido al objeto_servicio_id del backend, y crea
 * el turno via POST /api/v1/mis-turnos.
 *
 * Astro lo compila como parte del Worker SSR de Cloudflare.
 * El frontend no cambia: sigue llamando a POST /api/reservas.
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
      const errText = await authRes.text();
      console.error('[reservas] auth falló:', authRes.status, errText);
      return json({ error: 'Auth con Google falló' }, 401);
    }
    const authData = await authRes.json();
    const accessToken = authData.access_token;

    // 2. Obtener servicios del prestador
    const prestadorRes = await fetch(
      `${apiUrl}/api/v1/prestadores/${prestadorSlug}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!prestadorRes.ok) {
      return json({ error: 'Prestador no encontrado' }, 500);
    }
    const prestador = await prestadorRes.json();
    const servicios = prestador.servicios || [];
    if (servicios.length === 0) {
      return json({ error: 'El prestador no tiene servicios cargados' }, 500);
    }

    // 3. Mapear el servicio elegido a un objeto_servicio_id
    const MAPEO_CATEGORIA = {
      mantenimiento: 'Mantenimiento',
      frenos: 'Frenos',
      motor: 'Motor',
      diagnostico: 'Motor',
      otro: null,
    };
    const categoriaBuscada = MAPEO_CATEGORIA[body.servicio] || null;
    const servicioElegido = categoriaBuscada
      ? servicios.find((s) => s.categoria_servicio === categoriaBuscada)
      : servicios[0];
    if (!servicioElegido) {
      return json({ error: 'No hay servicio disponible para esa categoría' }, 500);
    }

    // 4. Armar notas_cliente con datos del vehículo
    const notasCliente = [
      `Vehículo: ${body.marca || '?'} ${body.modelo || '?'} ${body.anio || '?'}`,
      `Patente: ${body.patente || '?'}`,
    ].join(' | ');

    // 5. Normalizar fecha_inicio
    let fechaISO;
    try {
      fechaISO = new Date(body.fecha_inicio).toISOString();
    } catch {
      return json({ error: 'Fecha inválida' }, 400);
    }

    // 6. Crear turno
    const turnoRes = await fetch(`${apiUrl}/api/v1/mis-turnos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        prestador_id: prestador.id,
        objeto_servicio_id: servicioElegido.id,
        fecha_inicio: fechaISO,
        duracion_min: servicioElegido.duracion_estimada_min || 30,
        motivo: body.motivo || null,
        notas_cliente: notasCliente,
      }),
    });

    if (!turnoRes.ok) {
      const errText = await turnoRes.text();
      console.error('[reservas] turno falló:', turnoRes.status, errText);
      return json({ error: 'No se pudo crear el turno' }, 500);
    }

    return json({ success: true }, 201);
  } catch (e) {
    console.error('[reservas] error inesperado:', e);
    return json({ error: e.message || 'Error interno' }, 500);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
