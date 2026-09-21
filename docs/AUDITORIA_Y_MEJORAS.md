# AdminYAAA — Auditoría y mejoras (versión 3)

## 1. Qué se probó y qué no

**Probado de verdad**
- **Página publicada (versión 2, en GitHub Pages):** los 12 recursos responden 200, sin errores de consola, todos los enlaces (WhatsApp, correo, Instagram, "Cómo llegar") apuntan bien, carga completa en ~0,5 s.
- **Versión 3 (esta):** sin desbordes horizontales en 320, 375, 500 y 1440 px; tablet y escritorio revisados con capturas en Chrome; contrastes calculados; recursos y anclas sin roturas; datos estructurados válidos y coincidentes con las 6 preguntas visibles; los dos WhatsApp con el mismo número de apariciones (6 y 6).

**NO probado (hay que hacerlo antes de publicar)**
- PageSpeed/Lighthouse, iPhone y Android reales, Safari y Firefox, lector de pantalla.
- Que WhatsApp abra el chat desde un celular con la app instalada.
- Vista previa al compartir el link (necesita dominio).

## 2. Qué se le criticó a la versión 2 y qué se hizo

| Crítica | Medición | En la versión 3 |
|---|---|---|
| Demasiado larga y repetitiva | 1.090 palabras · 13 pantallas (escritorio) · ~19 (celular) | **546 palabras · ~11 pantallas en celular** |
| Demasiados botones de WhatsApp | 12 enlaces, 14 botones verdes | Un llamado único y repetido: "Contanos qué necesitás resolver" |
| Formulario con 3 botones de envío | Confundía | **Eliminado** (para un público mayor, escribir directo es más simple) |
| Botón principal cortado en celular | Quedaba bajo el pliegue | **Visible en la primera pantalla** (medido a 375 px) |
| Tablero de ejemplo inventado | Podía leerse como un entregable real | **Eliminado** |
| Lectura larga sobre fondo oscuro | Cansa más, sobre todo a los mayores | **Zonas de lectura sobre fondo claro**; el azul queda para encabezado, portada, pasos, contacto y pie |
| Letra chica | 16 px base, 12–13 px en detalles | **18 px base, mínimo 15 px** |
| Enfoque solo en el servicio | No hablaba de la necesidad del cliente | **Tarjetas en primera persona** ("Necesito ordenar mis números", "Quiero vender online") |

Peso de la carga inicial: **~86 KB** (antes ~112 KB).

## 3. Comparación con la versión del dueño

Se compararon solo tres capturas (portada, servicios y contacto); no se vio el resto.

| Criterio | Versión del dueño | Versión 3 |
|---|---|---|
| ¿Qué hace AdminYAAA? (5 segundos) | Poco claro ("lo que tu negocio necesita resolver, lo vemos juntos") | **Claro** (administración: facturación, pagos, cobranzas, trámites) |
| Enfoque en el cliente | **Muy bueno** | Incorporado (tarjetas en primera persona, mismo llamado repetido) |
| Diferenciación | No menciona al contador | **"Junto a tu contador"** |
| Largo | Corta | Corta (546 palabras) |
| Estética | Fondo claro, logo original | Azul de la tarjeta con zonas claras para leer |
| Servicio "vender online" | Sí | **Incorporado** (confirmado por el dueño) |

**Qué se tomó del dueño:** el llamado "Contanos qué necesitás resolver", las cuatro tarjetas y sus textos, los 3 pasos y "Empezamos por escucharte".
**Qué se conserva de la versión anterior:** el H1, la tarjeta Vos/Nosotros, la diferencia de "junto a tu contador", el FAQ, los datos estructurados y el mapa.

## 4. Auditoría de la versión 3

Leyenda: ✅ bien · ⚠️ mejorable · ❌ falta (por falta de datos)

| Área | Estado | Detalle |
|---|---|---|
| **UX** | ✅ | Un solo recorrido; cada sección responde una pregunta; pocas opciones por pantalla. |
| **UI** | ✅ | Estética de la tarjeta, sin degradados ni sombras pesadas. ⚠ Sin fotos ni personas. |
| **Mobile** | ✅ | Barra fija con los dos WhatsApp (se oculta cuando ya están a la vista), menú grande, botones de 60–72 px. ⚠ Falta probar en dispositivos reales. |
| **Accesibilidad** | ✅ | Letra base 18 px, contraste mínimo 5,9:1 (el resto entre 8,7:1 y 15,2:1), "saltar al contenido", foco visible de 4 px, semántica correcta, sin animaciones, enlaces externos avisan que abren pestaña nueva. ⚠ Falta prueba con lector de pantalla. |
| **SEO** | ✅ técnico / ⚠️ contenido | Título, meta (153 caracteres), H1 único, schema `ProfessionalService` + `FAQPage`, `lang="es-AR"`, Instagram en `sameAs`. ⚠ Una sola página; `noindex` activo (correcto para un borrador). |
| **Conversión** | ✅ | Un llamado único, dos WhatsApp iguales, mensaje ya armado. ⚠ No hay medición de consultas. |
| **Velocidad** | ✅ (estimada) | ~86 KB, sin librerías, mapa con carga diferida. ⚠ Falta medirla con PageSpeed. |
| **Claridad** | ✅ | Vocabulario simple, sin jerga. |
| **Credibilidad** | ❌ / ⚠️ | Dirección con mapa, dos vías directas, Instagram, honestidad sobre lo que no se sabe. Faltan personas, casos, reseñas, seguridad de datos y correo con dominio propio (hoy Gmail). |
| **Errores de contenido** | ✅ | Ninguna frase sin respaldo. Quedan **5 comentarios** `[DATO A COMPLETAR]` en el código (dominio, schema, pasos, preguntas frecuentes y horarios/ubicación). |

### Riesgos y límites
1. **Vista previa al compartir:** no funcionará hasta tener dominio (`og:image` necesita dirección absoluta).
2. **El repositorio está público** (GitHub Pages lo exige en cuentas gratuitas), así que `docs/` es visible para cualquiera.
3. **Los 3 pasos y los textos de las tarjetas** vienen de la versión del dueño; conviene que confirme que "vender online" incluye exactamente catálogo, tienda y publicaciones.
4. **La ficha de Google Maps no pudo leerse:** no se conoce su puntaje ni reseñas.
5. **El logo claro** se generó recoloreando el PNG; conviene la versión vectorial oficial.
6. **Sin formulario:** ya no hay forma de "dejar los datos" en la web; todo pasa por WhatsApp, correo o Instagram.

## 5. Mejoras recomendadas, por prioridad

### Antes de publicar
1. Que el dueño **confirme los textos** de las 5 tarjetas y los 3 pasos.
2. **Cargar horarios** y confirmar el alcance geográfico del servicio remoto.
3. **Dominio + correo institucional**, canonical, `og:image` absoluta, schema completo.
4. **Probar en celulares reales** los dos WhatsApp.
5. **Completar la ficha de Google Business Profile** (web, horarios, servicios, fotos).

### Primer mes
6. **"Quiénes somos" mínimo**: nombres, una foto real y una línea de experiencia. Es lo que más falta.
7. **Fotos reales** de la oficina y del equipo.
8. **1 a 3 testimonios reales** y las **reseñas de Google**.
9. **Una respuesta sobre seguridad** de datos y accesos.
10. **Un criterio de precio** (aunque sea "depende de X, Y, Z").
11. **Medir** clics en WhatsApp con una herramienta sin cookies (Plausible o Umami).

### Más adelante
12. Páginas propias para **vender online** y para **administración de comercios**, con contenido útil real.
13. Search Console para validar keywords; publicaciones periódicas en la ficha de Google.
14. Logo vectorial (versión clara y oscura) y sesión de fotos profesional.
