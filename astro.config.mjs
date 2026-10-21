import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';

/**
 * Configuración de Astro.
 *
 * - site: dominio canónico para SEO y sitemaps.
 * - output: 'static' → todas las páginas se pre-renderizan en build time.
 *   Los fetch a la API se hacen en build, no en el navegador del usuario.
 * - adapter: vercel() → todavía se usa para el deploy actual. Migraremos a
 *   Cloudflare Pages en el próximo paso (mismo código, distinto adaptador).
 * - env.schema: declara las variables públicas que la app puede leer con
 *   `import { X } from 'astro:env/client'`. Astro valida tipos y falla en
 *   build si falta una requerida. Esto reemplaza el patrón `import.meta.env`
 *   con fallback hardcodeado, que era la causa del bug del `clientdev.apk`
 *   servido desde producción.
 */
export default defineConfig({
  site: 'https://sealquilamarido.com',
  output: 'static',
  integrations: [tailwind()],
  env: {
    schema: {
      // URL base de la API (dev o prod según el environment de despliegue).
      PUBLIC_API_URL: envField.string({ context: 'client', access: 'public' }),

      // URL del APK client a servir en /app. En dev apunta a app-clientdev.apk,
      // en prod a app-client.apk. Antes estaba hardcodeado en app.astro.
      PUBLIC_APK_URL: envField.string({ context: 'client', access: 'public' }),

      // Etiqueta del entorno actual, útil para debugging visual y analytics.
      // Valores permitidos: dev | staging | prod.
      PUBLIC_ENV: envField.enum({
        context: 'client',
        access: 'public',
        values: ['dev', 'staging', 'prod'],
        default: 'prod',
      }),
    },
  },
});
