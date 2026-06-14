# Calendario Tributario DIAN — Arquitectura del Proyecto

## Visión General

Aplicación multiplataforma (web + iOS + Android) para contadores colombianos que gestiona el calendario de vencimientos tributarios de la DIAN. Con solo ingresar un NIT, la app calcula automáticamente los fechas de vencimiento según el último dígito y envía notificaciones push y por correo electrónico días antes del vencimiento.

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| App (web + móvil) | **Expo (React Native)** | Un solo codebase para iOS, Android y Web |
| Navegación | **Expo Router** | File-based routing, soporte web nativo |
| Estilos | **NativeWind** (Tailwind para RN) | Desarrollo rápido y consistente |
| Backend / DB | **Firebase Firestore** | NoSQL en tiempo real, SDK móvil nativo |
| Autenticación | **Firebase Auth** | Email/password, Google Sign-In |
| Push Notifications | **Firebase Cloud Messaging (FCM)** via Expo Notifications | Notificaciones push iOS + Android |
| Notificaciones Email | **Firebase Cloud Functions** + **Nodemailer** (Gmail SMTP) | Serverless, capa gratuita generosa |
| Tareas programadas | **Firebase Cloud Functions** (Pub/Sub Scheduler) | Job diario que detecta vencimientos próximos |
| Hosting Web | **Firebase Hosting** | CDN global, SSL automático |

---

## Modelos de Datos (Firestore)

### Colección: `users/{userId}`
```json
{
  "uid": "string",
  "email": "string",
  "nombre": "string",
  "firma": "string (opcional — nombre de la firma contable)",
  "notificaciones": {
    "push": true,
    "email": true,
    "diasAntes": [3, 7, 15]
  },
  "creadoEn": "timestamp"
}
```

### Subcolección: `users/{userId}/nits/{nitId}`
```json
{
  "nit": "string (ej: 900123456)",
  "digitoVerificacion": "string (ej: 1)",
  "razonSocial": "string",
  "email": "string (email específico para notificaciones de este NIT — opcional)",
  "obligaciones": ["IVA", "RETEFUENTE", "RENTA", "ICA", "EXOGENA"],
  "activo": true,
  "creadoEn": "timestamp"
}
```

### Colección: `notificaciones_enviadas/{id}`
```json
{
  "userId": "string",
  "nitId": "string",
  "obligacion": "string",
  "fechaVencimiento": "timestamp",
  "diasAntes": 7,
  "canales": ["push", "email"],
  "enviadoEn": "timestamp"
}
```

---

## Reglas del Calendario DIAN

La DIAN asigna fechas de vencimiento escalonadas según el **último dígito del NIT** (antes del dígito de verificación).

### Principales Obligaciones Cubiertas (MVP)

| Código | Obligación | Periodicidad |
|--------|-----------|--------------|
| `IVA_BIMESTRAL` | IVA Régimen Común (bimestral) | Bimestral |
| `IVA_CUATRIMESTRAL` | IVA Pequeños Contribuyentes | Cuatrimestral |
| `RETEFUENTE` | Retención en la Fuente | Mensual |
| `RENTA_PN` | Declaración de Renta (Personas Naturales) | Anual |
| `RENTA_PJ` | Declaración de Renta (Personas Jurídicas) | Anual |
| `EXOGENA` | Información Exógena | Anual |
| `ICA` | Industria y Comercio | Bimestral / Anual |
| `SIMPLE` | Régimen SIMPLE | Bimestral |

---

## Arquitectura de Notificaciones

```
Firebase Cloud Function (cron: diario a las 7am)
    │
    ├─▶ Consulta Firestore: NITs con vencimientos en X días
    │
    ├─▶ Push Notification (FCM) → dispositivos móviles del contador
    │
    └─▶ Email (Nodemailer → Gmail SMTP) → email del contador
                                        → email del NIT (si configurado)
```

### Flujo de días de anticipación
- El contador configura: notificar 3, 7 y/o 15 días antes
- El job diario calcula `fechaVencimiento - hoy = N días` y si N ∈ `diasAntes` → envía notificación
- Se registra en `notificaciones_enviadas` para evitar duplicados

---

## Estructura de Carpetas del Proyecto

```
calendario-dian/
├── app/                          # Expo Router (pantallas)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── registro.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard — próximos vencimientos
│   │   ├── nits.tsx              # Lista de NITs
│   │   ├── calendario.tsx        # Vista calendario mensual
│   │   └── perfil.tsx            # Configuración y notificaciones
│   ├── nit/
│   │   ├── [id].tsx              # Detalle de NIT
│   │   └── nuevo.tsx             # Agregar NIT
│   └── _layout.tsx
├── components/
│   ├── VencimientoCard.tsx
│   ├── NitCard.tsx
│   ├── CalendarioMes.tsx
│   └── ui/                       # Botones, inputs, etc.
├── constants/
│   └── calendario-dian.ts        # Datos estáticos del calendario
├── lib/
│   ├── firebase.ts               # Config Firebase
│   ├── firestore.ts              # Helpers CRUD
│   └── notificaciones.ts         # Lógica de notificaciones locales
├── hooks/
│   ├── useNits.ts
│   ├── useVencimientos.ts
│   └── useAuth.ts
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── notificaciones.ts     # Job diario
│   │   └── email.ts              # Envío de emails
│   └── package.json
├── app.json                      # Config Expo
├── firebase.json                 # Config Firebase
└── package.json
```

---

## Plan de Desarrollo por Fases

### Fase 1 — MVP (4-6 semanas)
- [x] Arquitectura y modelos de datos
- [ ] Scaffolding Expo + Firebase
- [ ] Auth (registro/login)
- [ ] Gestión de NITs (CRUD)
- [ ] Calendario DIAN 2025-2026 (datos estáticos)
- [ ] Dashboard de próximos vencimientos
- [ ] Notificaciones push (Expo Notifications)
- [ ] Notificaciones email (Cloud Functions)

### Fase 2 — Mejoras (mes 2-3)
- [ ] Consulta de estado en DIAN (web scraping o API si disponible)
- [ ] Exportar calendario a PDF
- [ ] Múltiples contadores / firma contable
- [ ] Vista calendario interactiva
- [ ] Historial de cumplimiento

### Fase 3 — Monetización (mes 4+)
- [ ] Plan gratuito (hasta 5 NITs)
- [ ] Plan Pro (NITs ilimitados + reportes)
- [ ] Integración con software contable (Siigo, World Office)

---

## Configuración Firebase Requerida

1. Crear proyecto en [console.firebase.google.com](https://console.firebase.google.com)
2. Habilitar: **Authentication** (Email/Password + Google)
3. Habilitar: **Firestore** (modo producción)
4. Habilitar: **Cloud Functions** (requiere plan Blaze — pago por uso)
5. Habilitar: **Cloud Messaging** (FCM)
6. Descargar `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)

---

## Variables de Entorno Necesarias

```env
# Firebase Web Config
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Cloud Functions (secrets)
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```
