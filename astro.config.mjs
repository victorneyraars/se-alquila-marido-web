import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://sealquilamarido.com',
  output: 'static',
  integrations: [tailwind()],
  adapter: vercel({
    isr: {
      bypassToken: process.env.VERCEL_BYPASS_TOKEN,
      expiration: 60 * 60 * 24,
    },
  }),
});
