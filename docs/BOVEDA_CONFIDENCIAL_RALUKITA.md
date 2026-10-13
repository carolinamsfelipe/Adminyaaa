# 🔒 ADMINYAAA — BÓVEDA CONFIDENCIAL DE CLAVES Y ACCESOS DE CLIENTES
**DOCUMENTO DE SEGURIDAD EXCLUSIVO &bull; CUENTA: `ralukita101@gmail.com`**
*Fecha de Emisión: Octubre 2026 &bull; Clasificación: MÁXIMO SECRETO COMERCIAL (NIVEL 4)*

---

## 1. Declaración de Confidencialidad y Custodia
Este documento contiene las claves maestras, credenciales fiscales (ARCA/AFIP), accesos a servicios bancarios (Interbanking/Homebanking) y contraseñas de sistemas de facturación y punto de venta correspondientes a los clientes bajo la administración integral de **AdminYAAA**.

> **ATENCIÓN:** Este archivo y su contenido se encuentran bajo la custodia directa de **Carolina Felipe (Ralukita)**. Ningún operador, asistente ni tercero tiene autorización para acceder o divulgar las combinaciones de acceso aquí detalladas.

---

## 2. Protocolo Criptográfico de Resguardo
1. **Algoritmo de Cifrado en Reposo:** AES-256-GCM (Galois/Counter Mode).
2. **Derivación de Clave Maestra:** PBKDF2 con HMAC-SHA-256 y 100.000 iteraciones.
3. **Control de Fugas:** Todas las contraseñas en la aplicación se mantienen enmascaradas con temporizador de auto-bloqueo a los 25 segundos y registro inmutable en el log de auditoría.
4. **Clave Maestra de Bóveda (Master Passphrase):** `ralukita2026!`

---

## 3. Matriz de Credenciales Fiscales y Bancarias por Cliente

### 🏢 1. Parrilla Los Robles (Gastronomía & Parrilla)
- **Razón Social:** Los Robles Gastronomía S.R.L.
- **CUIT:** `30-71458920-4`
- **Contacto Principal:** Hugo Robles (Dueño) &bull; `11 5566-7788`
- **Operador Designado:** Máximo Ferreyra (Solo gestión de comprobantes, sin clave fiscal directa)

| Servicio / Sistema | Usuario / Identificador | Clave de Acceso (Encriptada / Despejada) | Nivel / Ámbito | Notas Operativas |
|---|---|---|---|---|
| **ARCA / AFIP** | `30-71458920-4` | `RoblesAfip$2026` | Clave Fiscal Nivel 3 | Presentación de IVA, Libro de Sueldos Digital y F. 931 mensual. |
| **Domicilio Fiscal Electrónico (DFE)** | CUIT Hugo Robles | `DfeRobles#88` | Notificaciones ARCA | Revisión semanal de intimaciones y requerimientos. |
| **Banco Galicia (Consultas)** | Usuario: `ADM_ROBLES` | `GaliciaParrilla#99` | Consulta de extractos | Usuario operador sin firma bancaria (solo lectura de saldos para conciliación). |
| **Maxirest (Punto de Venta)** | Terminal Servidor Central | `MaxiAdmin#2026` | Supervisor Caja | Cierre diario de turnos tarde/noche y exportación de ventas. |

---

### 🏢 2. Distribuidora Máximo (Mayorista de Almacén)
- **Razón Social:** Distribuidora Máximo S.A.
- **CUIT:** `30-68940123-2`
- **Contacto Principal:** Máximo Fernández &bull; `11 4455-2210`
- **Operador Designado:** Joaquín Ibáñez

| Servicio / Sistema | Usuario / Identificador | Clave de Acceso (Encriptada / Despejada) | Nivel / Ámbito | Notas Operativas |
|---|---|---|---|---|
| **ARCA / AFIP** | `30-68940123-2` | `MaximoDist2026*` | Clave Fiscal Nivel 3 | Emisión de CAEA masivo y remitos electrónicos de despacho. |
| **Tango Gestión (Servidor)** | `admin_deposito` | `AdminTango#2026!` | Administrador Base SQL | Sincronización de inventario físico y órdenes de compra. |
| **Banco Nación (Interbanking)** | `OPERADOR_AY` | `BNA_Maximo#2026` | Consulta y VEPs | Generación de VEPs impositivos para pago directo por el dueño. |

---

### 🏢 3. Maderera Ramos Mejía (Comercio & Depósito)
- **Razón Social:** Maderas del Oeste S.A.S.
- **CUIT:** `30-71829456-1`
- **Contacto Principal:** Carlos Bertolini &bull; `11 6789-1234`
- **Operador Designado:** Carolina Sánchez

| Servicio / Sistema | Usuario / Identificador | Clave de Acceso (Encriptada / Despejada) | Nivel / Ámbito | Notas Operativas |
|---|---|---|---|---|
| **ARCA / AFIP** | `30-71829456-1` | `MadereraRM$2026` | Clave Fiscal Nivel 3 | Facturación de presupuestos y comprobantes A/B a clientes. |
| **ARBA (Prov. Bs. As.)** | CUIT `30-71829456-1` | `ArbaMaderas#26` | Ingresos Brutos | Presentación de DDJJ mensual convenio multilateral. |
| **Banco Santander** | `OPER_MADERERA` | `SantanderRM#77` | Consulta de CBU | Conciliación de transferencias de clientes mayoristas. |

---

### 🏢 4. Café & Resto El Portal (Gastronomía)
- **Razón Social:** Gastronomía San Justo S.R.L.
- **CUIT:** `30-71556677-8`
- **Contacto Principal:** Esteban Portal &bull; `11 3344-5566`
- **Operador Designado:** Máximo Ferreyra

| Servicio / Sistema | Usuario / Identificador | Clave de Acceso (Encriptada / Despejada) | Nivel / Ámbito | Notas Operativas |
|---|---|---|---|---|
| **ARCA / AFIP** | `30-71556677-8` | `ElPortalResto$26` | Clave Fiscal Nivel 3 | Control de controladores fiscales y facturación de turnos. |
| **Fudo (Software Gastronómico)** | `admin@elportal.com` | `FudoPortal#2026` | Gestión de Mesas | Cruce de comandas vs. dinero en caja física. |

---

## 4. Canales de Acceso Oficial de AdminYAAA
- **Portal Interno de Bóveda:** `https://adminya.com.ar/panel/#/boveda`
- **SuperAdmin Account:** `ralukita101@gmail.com`
- **Clave Maestra Activa:** `ralukita2026!`

---

## 5. Procedimiento de Contingencia y Rotación de Claves
En caso de desvinculación de un operador o sospecha de compromiso:
1. Ingresar inmediatamente a `https://adminya.com.ar/panel/#/boveda` con la cuenta de Ralukita.
2. Modificar la contraseña en el portal oficial de ARCA/banco.
3. Actualizar la clave en la Bóveda del sistema, lo que regenera automáticamente el vector criptográfico AES-256 y emite una alerta en el log de auditoría.
