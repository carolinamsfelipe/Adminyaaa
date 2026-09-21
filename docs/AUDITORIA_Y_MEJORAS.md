# AdminYAAA — Revisión como cliente, auditoría final y mejoras

## Qué se probó y qué no (importante)

**Probado de verdad** (en el navegador integrado, con la página corriendo):
- Se ve y funciona (con la estética actual) en escritorio (1360 px), tablet (820 px) y celular (375 y 320 px), sin desbordes horizontales.
- El formulario arma bien el mensaje (con tildes, saltos de línea y también vacío) para los dos WhatsApp y el correo.
- El mapa carga y el marcador cae sobre Av. Gaona.
- Datos estructurados (JSON-LD) válidos; el FAQ visible coincide palabra por palabra con el del schema.
- Sin enlaces internos rotos, sin recursos faltantes, sin IDs duplicados, todas las imágenes con `alt`.
- Los dos WhatsApp aparecen el mismo número de veces (7 y 7) y con idéntico estilo.
- Ninguna de las frases que se querían evitar ("soluciones integrales", "core business", "líderes", etc.), ni "consorcio", ni cifras inventadas.
- Contrastes de color calculados (ver estrategia): todo el texto supera AAA (mínimo 6,2:1) y los campos del formulario superan el 3:1 exigido para componentes.

**NO probado** (hay que hacerlo antes de publicar):
- PageSpeed / Lighthouse (no pude ejecutarlo). Peso estimado de la carga inicial: **~112 KB** sin contar el mapa, lo que es muy liviano, pero no es una medición de velocidad real.
- Dispositivos reales (iPhone, Android), Safari y Firefox: solo se probó en un navegador tipo Chrome.
- Lector de pantalla (VoiceOver, TalkBack, NVDA).
- Que WhatsApp abra correctamente el chat desde un celular con la app instalada.
- Vista previa al compartir el link (necesita dominio; ver abajo).

---

## Etapa 10 — Recorrido como potencial cliente

Recorrí la página como tres personas distintas, leyendo solo lo que dice la pantalla.

**1) Dueña de un local de comidas, que hace las cuentas de noche.**
- *En 5 segundos*: entiende "administración", "para comercios", "junto a tu contador". ✔
- *Se identifica*: en "Gastronomía" ve costeo de platos y márgenes, que es justo su dolor. ✔
- *Duda que le queda*: "¿cuánto cuesta?" → la respuesta ("depende de tu caso") es honesta pero no la ayuda a decidir. ⚠
- *Actúa*: WhatsApp inmediato desde el celular (barra fija). ✔

**2) Profesional independiente que factura y cobra.**
- Entiende el servicio, pero "Profesionales" es la fila con menos detalle. Se pregunta si el servicio es "para alguien tan chico". ⚠
- La pregunta "¿Qué servicios incluyen? Podés necesitar solo una parte" lo tranquiliza. ✔

**3) Dueño de una PyME que ya tiene contador y desconfía.**
- La sección "Tu contador sigue siendo tu contador" le responde su objeción principal antes de que la formule. ✔ (es lo más fuerte de la página)
- Le faltan dos cosas para confiar: **quién está detrás** (no hay nombres ni caras) y **qué pasa con sus datos y accesos** (no se habla de seguridad). ❌ Es el mayor hueco de credibilidad, y **no se puede llenar sin datos reales**.

**Conclusión:** la página explica muy bien *qué hacen* y *cómo contactarlos*. Lo que falta para convencer a alguien desconfiado es **prueba real**: personas, un caso, reseñas, y una idea de precio.

---

## Etapa 11 — Auditoría

Leyenda: ✅ bien · ⚠️ mejorable · ❌ falta (por falta de datos)

| Área | Estado | Detalle |
|---|---|---|
| **UX** | ✅ | Un solo recorrido claro; cada sección responde una pregunta; contacto accesible desde 4 lugares (encabezado, portada, barra fija, contacto). |
| **UI** | ✅ | Estética tomada de la tarjeta de la marca (azul marino + verde brillante, iconos en círculos verdes), sin degradados ni sombras pesadas, jerarquía clara. ⚠ Sin fotos: la página es 100 % tipográfica e iconográfica. |
| **Mobile** | ✅ | Barra fija con los dos WhatsApp que se oculta cuando ya están a la vista; menú desplegable; objetivos táctiles ≥ 44 px en botones y enlaces principales. ⚠ Falta probar en dispositivos reales. |
| **SEO** | ✅ técnico / ⚠️ contenido | Título, meta, H1 único, jerarquía de encabezados, schema `ProfessionalService` + `FAQPage`, `lang="es-AR"`, texto real (no imágenes). ⚠ Es una sola página: el potencial de posicionar por rubro o por zona está sin usar. ⚠ `noindex` activo (correcto para un borrador). |
| **Conversión** | ✅ | CTA único y repetido, mensaje de WhatsApp ya armado, formulario de 4 campos, ninguna fricción (sin registro, sin teléfono obligatorio). ⚠ No hay medición: no se sabrá cuántas consultas llegan desde la web (ver mejoras). |
| **Accesibilidad** | ✅ | Enlace "saltar al contenido", estructura semántica, foco visible, contraste AA, `aria-expanded` en el menú, preguntas con `<details>`, respeta "reducir movimiento", enlaces externos avisan que abren pestaña nueva. ⚠ Falta prueba con lector de pantalla. |
| **Velocidad** | ✅ (estimada) | ~112 KB, un CSS, un JS con `defer`, tipografía propia con preload, sin librerías, mapa con carga diferida. ⚠ Falta medirlo. |
| **Claridad** | ✅ | Vocabulario simple, sin jerga; voseo. La sección "Vos / Nosotros" resume el servicio en 10 segundos. |
| **Credibilidad** | ❌ / ⚠️ | Fortalezas: dirección real con mapa, dos vías de contacto, honestidad sobre lo que no se sabe. Faltan: personas, casos, reseñas, seguridad de datos, correo con dominio propio (hoy es Gmail). |
| **Errores de contenido** | ✅ | Se corrigieron dos frases que no se podían respaldar ("sin compromiso de entrada" y "WhatsApp directos"). Quedan **8 pendientes marcados** como `[DATO A COMPLETAR]` en el código. |
| **Información faltante** | ❌ | Ver lista completa en la sección 1 de la estrategia. Las más urgentes: horarios, alcance geográfico, cómo se cobra/primera consulta, quién está detrás. |

### Riesgos y límites que conviene conocer
1. **La vista previa al compartir el link no funcionará hasta tener dominio** (`og:image` necesita dirección absoluta). Es importante porque este negocio se comparte por WhatsApp.
2. **El tablero "Así puede verse el orden" es ficticio.** Está rotulado como "Ejemplo ilustrativo" y "datos ficticios", pero la mejor versión de esa sección es un ejemplo **real y anonimizado**, con permiso de un cliente.
3. **Los rubros y los 4 pasos vienen del borrador original**, no de una validación independiente. Hay que confirmarlos.
4. **La ficha de Google Maps no pude leerla**: no sé su puntaje, reseñas, categoría ni horarios. Si tiene buenas reseñas, es la prueba social más barata de mostrar.
5. **El mapa incrusta un servicio de Google.** Si se quiere evitar cualquier carga de terceros hasta que la persona lo pida, se puede reemplazar por una imagen con botón "Ver mapa".
6. **El logo claro para fondo oscuro lo generé yo recoloreando el PNG.** Se ve bien, pero la versión oficial (vectorial, SVG) del diseñador sería más nítida y fiel a la tarjeta.

---

## Etapa 12 — Mejoras recomendadas, en orden de prioridad

### A. Antes de publicar (bloqueantes)
1. **Validar con el negocio** los 4 pasos, los ejemplos por rubro y la frase de servicio "podés contratar solo una parte".
2. **Cargar horarios** y confirmar si el servicio remoto tiene alcance nacional o local. Con eso se puede armar una sección de zonas útil para SEO.
3. **Dominio + correo institucional** (`contacto@…`), canonical, `og:image` absoluta, schema completo.
4. **Probar en celulares reales** los dos WhatsApp y el formulario.
5. **Completar la ficha de Google Business Profile** con la dirección web, horarios, servicios y fotos.

### B. Primer mes (mayor impacto en confianza)
6. **"Quiénes somos" mínimo**: nombres, una foto real y una línea de formación/experiencia de quien atiende. Es lo que más falta.
7. **Fotos reales** de la oficina y del equipo. Sin stock.
8. **1 a 3 testimonios o casos reales**, con permiso, y las **reseñas de Google** (pedirlas a clientes actuales con un enlace directo).
9. **Una respuesta sobre seguridad**: cómo se manejan accesos y datos. Es la duda nº 1 de quien va a delegar la administración.
10. **Un criterio de precio**: aunque sea "el abono depende de X, Y, Z" o un "desde". Casi ningún competidor lo hace, y sería un diferencial.
11. **Decir qué recibe el cliente y cuándo** (por ejemplo, "un resumen mensual"), una vez que se confirme.
12. **Medir**: contar clics en WhatsApp y envíos del formulario con una herramienta sin cookies (por ejemplo Plausible o Umami), para saber qué funciona.

### C. Mes 2 en adelante (crecimiento)
13. **Páginas por rubro** con contenido útil y real: *costeo para gastronomía*, *administración para comercios*, *administración para profesionales*. Es lo que más puede mejorar el posicionamiento (nadie en Zona Oeste ocupa ese lugar).
14. **Search Console**: validar las keywords reales con datos de búsqueda y ajustar títulos.
15. **Publicaciones mensuales** en la ficha de Google (ejemplos, vencimientos, consejos).
16. **Instagram** (`@admin.yaaa`) ya está enlazado en la web y en el schema. Falta decidir si se muestran publicaciones en la página y mantener la cuenta activa.
17. **Logo en SVG (versión clara y oscura)** y, si hay presupuesto, una sesión de fotos profesional.
