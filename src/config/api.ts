/**
 * Configuración centralizada de la API de Baqueano.
 * Usa variables de entorno con fallback para dev/prod.
 *
 * Mejores prácticas:
 * - Tipos estrictos para todos los modelos.
 * - Funciones de fetch tolerantes a errores (nunca rompen la página).
 * - URLs centralizadas para facilitar cambios de entorno.
 */

export const API_URL =
  import.meta.env.PUBLIC_API_URL || 'https://api.baqueanonatales.com';

export const API_ENDPOINTS = {
  comercios: `${API_URL}/api/v1/comercios`,
  comercioPorSlug: (slug: string) => `${API_URL}/api/v1/comercios/${slug}`,
  categoriasComercio: `${API_URL}/api/v1/comercios/categorias`,
  prestadores: `${API_URL}/api/v1/prestadores`,
  prestadorPorSlug: (slug: string) => `${API_URL}/api/v1/prestadores/${slug}`,
  categoriasOficio: `${API_URL}/api/v1/prestadores/categorias`,
} as const;

// ============================================================
// Tipos compartidos
// ============================================================

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  icono: string | null;
  color_hex: string | null;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_desde_clp: number | null;
  precio_hasta_clp: number | null;
  duracion_estimada_min: number | null;
  garantia_dias: number | null;
  destacado: boolean;
}

export interface Review {
  id: string;
  rating: number;
  comentario: string | null;
  respuesta_prestador: string | null;
  created_at: string;
  cliente_nombre: string | null;
}

// ============================================================
// Comercios
// ============================================================

export interface ComercioListItem {
  id: string;
  slug: string;
  nombre: string;
  descripcion_corta: string | null;
  categoria: Categoria;
  direccion: string;
  ciudad: string;
  region: string;
  logo_url: string | null;
  portada_url: string | null;
  acepta_delivery: boolean;
  acepta_retiro: boolean;
  costo_envio_clp: number;
  pedido_minimo_clp: number;
  radio_entrega_km: string | null;
  rating_promedio: string;
  total_resenas: number;
  destacado: boolean;
}

export interface Horario {
  dia_semana: number;
  cerrado: boolean;
  abre: string | null;
  cierra: string | null;
}

export interface ComercioDetalle extends ComercioListItem {
  descripcion_larga: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  sitio_web: string | null;
  horarios: Horario[];
}

// ============================================================
// Prestadores (oficios)
// ============================================================

export interface PrestadorListItem {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  anios_experiencia: number | null;
  categoria: Categoria;
  comuna: string;
  region: string;
  foto_url: string | null;
  foto_portada_url: string | null;
  atiende_domicilio: boolean;
  atiende_local: boolean;
  atiende_emergencias: boolean;
  calificacion_promedio: string;
  total_resenas: number;
  verificado: boolean;
  destacado: boolean;
  especialidades: string[];
}

export interface PrestadorDetalle extends PrestadorListItem {
  telefono: string | null;
  whatsapp: string | null;
  email: string | null;
  sitio_web: string | null;
  direccion: string | null;
  horario_descripcion: string | null;
  redes_sociales: Record<string, string> | null;
  servicios: Servicio[];
  reviews: Review[];
}

// ============================================================
// Funciones de fetch
// ============================================================

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// --- Comercios ---

export async function fetchComercios(): Promise<{
  items: ComercioListItem[];
  meta: { total: number };
}> {
  return safeFetch(API_ENDPOINTS.comercios, { items: [], meta: { total: 0 } });
}

export async function fetchComercioPorSlug(
  slug: string,
): Promise<ComercioDetalle | null> {
  try {
    const res = await fetch(API_ENDPOINTS.comercioPorSlug(slug), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as ComercioDetalle;
  } catch {
    return null;
  }
}

// --- Prestadores ---

export async function fetchPrestadores(): Promise<{
  items: PrestadorListItem[];
  meta: { total: number };
}> {
  return safeFetch(API_ENDPOINTS.prestadores, { items: [], meta: { total: 0 } });
}

export async function fetchPrestadorPorSlug(
  slug: string,
): Promise<PrestadorDetalle | null> {
  try {
    const res = await fetch(API_ENDPOINTS.prestadorPorSlug(slug), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as PrestadorDetalle;
  } catch {
    return null;
  }
}

export async function fetchReviewsPrestador(slug: string): Promise<Review[]> {
  try {
    const res = await fetch(`${API_ENDPOINTS.prestadorPorSlug(slug)}/reviews?page_size=20`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: Review[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchCategoriasOficio(): Promise<Categoria[]> {
  return safeFetch(API_ENDPOINTS.categoriasOficio, []);
}

// ============================================================
// Utilidades
// ============================================================

export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

export function formatearHorario(h: Horario): string {
  if (h.cerrado) return 'Cerrado';
  if (!h.abre || !h.cierra) return 'Horario no disponible';
  return `${h.abre.slice(0, 5)} - ${h.cierra.slice(0, 5)}`;
}

export function formatearPrecio(clp: number | null): string {
  if (clp === null) return 'Consultar';
  return `$${clp.toLocaleString('es-CL')}`;
}


// ============================================================
// Mapeo de especialidades (slugs técnicos → nombres legibles)
// ============================================================

export const ESPECIALIDADES_MAP: Record<string, string> = {
  mantenimiento_preventivo: 'Mantenimiento preventivo',
  frenos: 'Frenos',
  suspension: 'Suspensión',
  motor: 'Motor',
  electricidad_auto: 'Electricidad automotriz',
  diagnostico_computarizado: 'Diagnóstico computarizado',
  auxilio_ruta: 'Auxilio en ruta',
  transmision: 'Transmisión',
  aire_acondicionado: 'Aire acondicionado',
  neumaticos: 'Neumáticos',
  escape: 'Escape',
  carroceria: 'Carrocería y pintura',
  pintura: 'Pintura',
  gasfiteria: 'Gasfitería',
  electricidad: 'Electricidad',
  carpinteria: 'Carpintería',
  albanileria: 'Albañilería',
  cerrajeria: 'Cerrajería',
  jardineria: 'Jardinería',
  limpieza: 'Limpieza',
  fletes: 'Fletes y mudanzas',
};

export function nombreEspecialidad(slug: string): string {
  return ESPECIALIDADES_MAP[slug] ?? slug.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
