import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://sealquilamarido.com',
  output: 'static',
  integrations: [tailwind()],
  adapter: vercel(),
});
