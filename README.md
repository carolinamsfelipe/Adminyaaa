# Mayorista a tu Casa
**Una iniciativa de AdminYAAA.**

Web de venta y distribución mayorista moderna, ágil y profesional, pensada para clientes particulares, familias, comercios y PyMEs que desean armar pedidos de supermercado y consumo masivo con precios por volumen y enviarlos directamente por WhatsApp.

---

## 🚀 Arquitectura y Stack Tecnológico

El proyecto está diseñado bajo una arquitectura modular desacoplada, sin frameworks pesados ni dependencias innecesarias, garantizando máxima velocidad de carga (sub-segundo), compatibilidad total móvil y funcionamiento inmediato.

* **Frontend**: HTML5 Semántico + CSS3 (Variables, Grid, Flexbox, Mobile-First) + JavaScript ES6+ Modules nativos.
* **Persistencia**: LocalStorage con namespace seguro (`mayorista_*`) y soporte preparado para base de datos (Supabase / Firebase / API REST).
* **Seguridad PCI-DSS**: Abstracción de medios de pago preparada para pasarela (Mercado Pago). **No se solicita CVV ni se guardan números de tarjeta completos.**
* **Canal de Cierre**: WhatsApp Business API vía enlace seguro `wa.me/5491130332341`.

### Estructura del Código

```text
/
├── index.html                  ← Plataforma principal de e-commerce
├── admin/
│   └── index.html              ← Panel administrativo para gestión de catálogo y pedidos
├── css/
│   ├── variables.css           ← Design tokens, paleta de colores y espaciados
│   ├── base.css                ← Resets y accesibilidad WCAG 2.1
│   ├── layout.css              ← Header, Hero, Footer, Drawers y navegación
│   ├── components.css          ← Cards de producto, combos, modales, toasts, checkout
│   └── responsive.css          ← Breakpoints móvil y barra de navegación inferior
├── js/
│   ├── config.js               ← Datos comerciales: WhatsApp, zonas de entrega y pagos
│   ├── data/
│   │   ├── catalog.js          ← 303 productos normalizados con fotos y marcas
│   │   ├── combos.js           ← 8 combos mayoristas sugeridos con desglose
│   │   └── categories.js       ← Secciones y categorías con metadatos
│   ├── services/
│   │   ├── storageService.js   ← Capa de persistencia local
│   │   ├── authService.js      ← Registro, login, sesiones y perfil
│   │   ├── addressService.js   ← Direcciones guardadas por usuario
│   │   ├── paymentService.js   ← Billetera y detección segura de tarjetas
│   │   ├── favoritesService.js ← Gestión de favoritos (invitados y usuarios)
│   │   ├── cartService.js      ← Motor de carrito y cálculo de totales
│   │   ├── ordersService.js    ← Historial de pedidos y recompra
│   │   └── whatsappService.js  ← Generador de enlaces y mensajes wa.me
│   ├── ui/
│   │   ├── toast.js            ← Feedback visual animado y accesible
│   │   ├── modal.js            ← Modales con foco y accesibilidad por teclado
│   │   ├── drawer.js           ← Drawers laterales (carrito y menú móvil)
│   │   └── quickView.js        ← Ficha y vista rápida de producto
│   └── app.js                  ← Orquestador y controlador principal
├── img/
│   ├── logo.png                ← Isologo oficial de la marca
│   └── productos/              ← 86 imágenes e ilustraciones WebP optimizadas
├── robots.txt                  ← Directivas para motores de búsqueda
├── sitemap.xml                 ← Mapa de sitio SEO
└── README.md                   ← Documentación del proyecto
```

---

## 💻 Cómo Ejecutar en Desarrollo

No necesitás instalar `node` ni compilar nada. Podés usar cualquier navegador o servidor web local:

### Opción 1: Servidor Local con Python (Recomendado)
```bash
python3 -m http.server 8080
```
Abrí tu navegador en: [http://localhost:8080](http://localhost:8080)

### Opción 2: Abrir directamente el archivo
Hacé doble clic en `index.html` en Chrome, Safari, Edge o Firefox.

---

## 👤 Cuentas y Accesos de Demostración

La aplicación cuenta con un usuario precargado para pruebas inmediatas:
* **Email**: `carolina@adminya.com.ar`
* **Contraseña**: `demo123`
*(Podés ingresar rápidamente haciendo clic en "⚡ Ingresar como Usuario Demo" en la ventana de login)*.

---

## 🛠️ Guía de Administración y Edición Comercial

### 1. Cómo cambiar el número de WhatsApp
Abrí `js/config.js` y modificá las líneas:
```javascript
whatsappNumber: '5491130332341',  // Formato internacional sin +, guiones ni espacios
whatsappVisible: '11 3033-2341',  // Cómo se muestra en pantalla
```

### 2. Cómo modificar productos y precios
Los 303 productos se encuentran estructurados en `js/data/catalog.js`:
```javascript
{
  "id": "M45",
  "name": "Aceite Natura x1500",
  "brand": "Natura",
  "section": "Almacén",
  "category": "Aceites y vinagre",
  "unit": "un.",
  "price": 3200,          // <-- Modificar precio actual
  "oldPrice": 3680,       // <-- Precio anterior (genera badge de Oferta)
  "badge": "MÁS VENDIDO", // <-- Badges: "OFERTA", "MÁS VENDIDO", "NUEVO", null
  "image": "img/productos/aceite.webp"
}
```

### 3. Cómo modificar o sumar Combos
Los combos están centralizados en `js/data/combos.js`. Cada combo cuenta con su lista de productos (`items`), precio total y badge:
```javascript
{
  "id": "C200",
  "name": "Esenciales para tu casa",
  "badge": "EMPEZÁ DESDE $200.000",
  "price": 200000,
  "oldPrice": 230000,
  "items": [
    { "productId": "M20", "quantity": 4 },
    { "productId": "M45", "quantity": 2 }
  ]
}
```

### 4. Cómo conectar el futuro proveedor de pagos (Mercado Pago)
La arquitectura está preparada mediante `js/services/paymentService.js`:
1. En `paymentService.js`, reemplazá `tokenMock` por la llamada al SDK oficial de Mercado Pago:
   ```javascript
   const token = await mp.fields.createCardToken({ cardholderName, identificationType, identificationNumber });
   ```
2. Enviá el `token` seguro al backend para ejecutar el `PaymentClient.create()`.
3. Nunca expongas tu `ACCESS_TOKEN` privado en el frontend.

---

## 🌐 Cómo hacer Deploy

El proyecto se puede publicar en segundos en cualquiera de las siguientes plataformas:

### Cloudflare Pages (Recomendado)
1. Conectá el repositorio GitHub `carolinamsfelipe/Mayoristaweb` a **Cloudflare Pages**.
2. **Build setting**: Dejalo vacío (sitio estático directo).
3. **Build output directory**: `/` (o la raíz del proyecto).
4. Guardá y desplegá. Cada `git push` a `main` se actualizará automáticamente en 1 minuto.

### Netlify
1. Arrastrá la carpeta completa a la zona *"Drag and drop your site output folder here"* en el panel de Netlify, o conectá el repositorio GitHub.

---

## 🔒 Seguridad y Privacidad
* Validación estricta de formularios y correos electrónicos.
* Cero almacenamiento de claves o secretos en código.
* No se guardan datos de tarjetas sensibles ni códigos CVV.
