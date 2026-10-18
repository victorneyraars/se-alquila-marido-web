# Se Alquila Marido — Landing Oficial

Landing page independiente para **Se Alquila Marido** (mecánica automotriz en Puerto Natales, Chile).
Construida con Astro + Tailwind CSS, hosteada en Vercel y conectada a la API de Baqueano Natales.

## 🌍 URLs
- **Producción:** https://sealquilamarido.com
- **Alias Vercel:** https://se-alquila-marido-web.vercel.app
- **API Backend:** https://api.baqueanonatales.com/api/v1
- **Baqueano (perfil):** https://www.baqueanonatales.com/prestadores/se-alquila-marido

## 🚀 Stack
- **Framework:** Astro 5 (`@astrojs/vercel@^9.0.5` para SSR/ISR)
- **Estilos:** Tailwind CSS
- **Hosting:** Vercel (deploy automático desde `main`)
- **DNS + SSL + Email Routing:** Cloudflare
- **Email Outbound:** Resend (vía API)
- **Monitoreo SEO:** Google Search Console (vía Service Account)

## 🛠️ Desarrollo Local
1. `npm install`
2. `npm run dev` (corre en `http://localhost:4321`)
3. `npm run build` (testea el build de producción)

## 📁 Estructura Crítica
- `src/pages/index.astro`: Landing principal. Incluye el JSON-LD `LocalBusiness` con los 12 servicios inyectados dinámicamente.
- `src/layouts/Layout.astro`: Header, footer, meta tags SEO, Open Graph, verificación de Google.
- `src/config/api.ts`: Cliente de la API de Baqueano (`fetchPrestadorPorSlug`, `fetchReviewsPrestador`).
- `public/`: Assets estáticos (favicons, OG image, sitemap, robots).

## 🔐 Secretos y Scripts (Configurados en el Servidor)
Los secretos **NO** están en este repo. Están en `~/.cf-env` en el servidor de despliegue (`deploy@baqueano-natales-prod`).
- Cloudflare (Global API Key + Token)
- Resend API Key
- Google Cloud Credentials (`~/.gcp-credentials.json`)

### Scripts útiles (en `~/bin/`)
- `gsc-setup.py`: Verifica propiedad en Search Console y envía el sitemap.
- `gsc-request-index.py`: Pide a Google que indexe una URL nueva.
  - *Uso:* `python3 ~/bin/gsc-request-index.py https://sealquilamarido.com/nueva-pagina`

## ⚠️ Reglas Operativas (IMPORTANTE)
1. **NO actualizar `@astrojs/vercel` a la v11**. Astro 5 es incompatible. Mantener `^9.0.5`.
2. **NO TOCAR el repo de Baqueano** (`~/baqueano-natales-web`). El cross-linking es un pendiente futuro lejano.
3. **Generación de archivos con unicode**: Si un heredoc (`cat << EOF`) se corta por problemas de terminal SSH, usar `python3` con `open().write()` para escribir el archivo.
4. **Tras cada deploy en Vercel**: Si se cambió algún DNS o hay caché vieja, purgar caché en Cloudflare.
5. **El usuario `deploy` no tiene `sudo`**: Para instalar paquetes de Python globales, usar `pip install --user --break-system-packages`.

## 📝 Pendientes / Próximos Pasos (Fase 3)
- [ ] **Formulario de contacto:** Crear un endpoint Serverless en Astro (`/api/contacto`) que envíe un mail vía Resend.
- [ ] **Nuevas páginas por oficio:** Agregar rutas para `/electricidad`, `/gasfiteria`, etc. (Requiere evaluar categorías en Baqueano).
- [ ] **Analytics:** Integrar Plausible o Google Analytics.
- [ ] **Cross-linking:** Agregar botón "Web oficial" desde el perfil de Baqueano hacia esta landing.

---
*Documentación generada el 2026-10-18.*
