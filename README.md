# AdminYAAA — sitio web

Página de una sola pantalla larga (landing) con la estética de la tarjeta de la marca (azul marino y verde brillante), en HTML + CSS + JavaScript simples. **No necesita instalar nada ni compilar.**

**Estado: borrador para revisión.** Tiene `noindex, nofollow`, así que Google no la indexa todavía.

## Cómo verla
Abrí `index.html` con doble clic. La carpeta `assets/` tiene que quedar junto al archivo.

## Qué hay en cada carpeta
```
index.html              ← TODO el contenido (textos, datos de contacto, FAQ, SEO)
assets/css/styles.css   ← diseño. Los colores están en las variables de arriba (:root)
assets/js/main.js       ← menú, barra de WhatsApp, formulario, animaciones
assets/img/             ← logo (versión clara para fondo oscuro), íconos y la imagen para compartir el link
assets/fonts/           ← tipografía Poppins (alojada acá, no se pide a Google)
docs/                   ← estrategia y auditoría
```

## Cómo editar
- **Textos:** buscá el texto en `index.html` y cambialo. Cada sección tiene un comentario con su nombre.
- **Teléfonos y correo:** están repetidos en varios lugares. Buscá `5491125604901` / `11 2560-4901` (y el otro número) y reemplazá **todas** las apariciones.
- **Colores:** `assets/css/styles.css`, bloque `:root` al principio.
- **Preguntas frecuentes:** si cambiás una respuesta, cambiala también en el bloque `FAQPage` del `<head>` (tiene que ser idéntica).
- **Datos pendientes:** están marcados como `[DATO A COMPLETAR]`. Para verlos todos:
  ```bash
  grep -n "DATO A COMPLETAR" index.html
  ```

## Antes de publicar (lista de control)
1. [ ] **Validar el contenido** con el negocio: los 4 pasos de "Cómo trabajamos" y los ejemplos por rubro.
2. [ ] **Cargar los horarios** (hoy dice "consultanos por WhatsApp"). Actualizar la sección "Dónde estamos", la pregunta 8 del FAQ (y su versión en el `<head>`) y agregar `openingHours` al schema.
3. [ ] **Definir el dominio.** Con el dominio final:
   - agregar `<link rel="canonical" href="https://DOMINIO/">`
   - pasar `og:image` a dirección absoluta (`https://DOMINIO/assets/img/og-image.png`) y agregar `og:url`. Sin esto, el link **no muestra vista previa** al compartirlo por WhatsApp.
   - agregar `url`, `logo` e `image` al schema `ProfessionalService`.
4. [ ] **Borrar la línea `<meta name="robots" content="noindex, nofollow">`** (la última acción, cuando todo esté listo).
5. [ ] Subir la carpeta a cualquier hosting estático (Netlify, Cloudflare Pages, GitHub Pages o el hosting del dominio). Es solo copiar los archivos.
6. [ ] Agregar `robots.txt` y `sitemap.xml` (una sola URL).
7. [ ] **Google Business Profile:** agregar la dirección web a la ficha y completar horarios, servicios, descripción y fotos.
8. [ ] Probar en **al menos un iPhone y un Android reales**: que los dos botones de WhatsApp abran el chat con el mensaje y que el formulario funcione.
9. [ ] Pasar la URL por PageSpeed Insights y por la prueba de resultados enriquecidos de Google.

## Cómo funciona el formulario
No usa servidor. Cuando la persona elige una opción, el botón de WhatsApp (o de correo) se actualiza con un mensaje ya armado y la persona lo envía. **La página no guarda ni recibe ningún dato.** Si más adelante quieren registrar las consultas (por ejemplo en una planilla), hay que sumar un servicio de formularios.

## Desarrollo
`.claude/launch.json` es solo una configuración para previsualizar desde Claude Code (`python3 -m http.server`). No hace falta para publicar.
