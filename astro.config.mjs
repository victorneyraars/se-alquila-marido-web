import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

/**
 * Configuración de Astro para la web vertical (Se Alquila Marido).
 * 
 * - output: 'server' → SSR habilitado. Consulta la API en cada request.
 * - adapter: cloudflare() → Compatible con Cloudflare Pages Functions (Edge).
 * - env.schema: Variables type-safe inyectadas en build time.
 */
export default defineConfig({
  site: 'https://sealquilamarido.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [tailwind()],
  env: {
    schema: {
      PUBLIC_API_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_APK_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_ENV: envField.enum({
        context: 'client',
        access: 'public',
        values: ['dev', 'staging', 'prod'],
        default: 'prod',
      }),
    },
  },
});
