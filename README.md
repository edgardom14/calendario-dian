# CalendarioDIAN

Plataforma web para contadores colombianos que centraliza el calendario de vencimientos tributarios ante la **DIAN**. Con solo ingresar un NIT, calcula automáticamente las fechas de vencimiento según el último dígito y envía alertas por correo electrónico días antes de cada obligación.

---

## Características del MVP

- **Gestión de empresas / NITs** — registra clientes con NIT, tipo de contribuyente y correo
- **Calendario automático** — calcula vencimientos según el último dígito del NIT
- **Vista global** — todos los vencimientos de todas las empresas en una pantalla, con filtros por urgencia
- **Alertas por correo** — envío automático 1, 3, 5, 7 y 15 días antes del vencimiento (configurable)
- **Instalable en celular** — PWA (Progressive Web App) para iOS y Android
- **Obligaciones cubiertas**: Retefuente, IVA bimestral y cuatrimestral, Renta PN y PJ, Información Exógena, SIMPLE, ICA

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / App | Next.js 16 (App Router) + Tailwind CSS |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Email | Resend |
| Cron / notificaciones | Vercel Cron Jobs → `/api/cron/notificaciones` |
| Deploy | Vercel |
| PWA (móvil) | Web App Manifest + metadatos Apple Touch |

---

## Configuración paso a paso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. En **SQL Editor**, pega y ejecuta el contenido completo de `lib/schema.sql`
3. Anota tus claves en Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Crear cuenta en Resend (envío de correos)

1. Ve a [resend.com](https://resend.com) → Create API Key
2. Verifica tu dominio (en desarrollo puedes usar `onboarding@resend.dev`)
3. Anota `RESEND_API_KEY` y el correo de origen `RESEND_FROM_EMAIL`

### 4. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completa `.env.local` con tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=alertas@tudominio.com
CRON_SECRET=genera-un-secreto-largo-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
DIAS_ALERTA=1,3,5,7,15
```

> Generar secreto: `openssl rand -hex 32`

### 5. Poblar los vencimientos

```bash
npx tsx --env-file=.env.local scripts/seed-vencimientos.ts
```

Esto crea automáticamente todos los tipos de impuestos y los vencimientos 2026 (Retefuente, IVA, Renta, ICA, SIMPLE, Exógena).

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

Para probar el envío de correos (en desarrollo no valida el secreto):

```bash
curl http://localhost:3000/api/cron/notificaciones
```

---

## Despliegue en Vercel

### 1. Conectar repositorio

En [vercel.com](https://vercel.com) → **Add New Project** → selecciona el repositorio.

### 2. Variables de entorno

En Vercel → Settings → Environment Variables, agrega las mismas variables que en `.env.local.example` con valores de producción. El `NEXT_PUBLIC_APP_URL` debe ser la URL de Vercel (ej: `https://calendario-dian.vercel.app`).

### 3. Cron Job automático

El archivo `vercel.json` configura el cron para ejecutar las alertas **todos los días a las 12:00 UTC** (7:00 AM hora Colombia). Vercel maneja la autenticación automáticamente — no necesitas configurar nada más.

### 4. Deploy

```bash
git push origin main
```

---

## Instalar como app en el celular (PWA)

**Android — Chrome:**
1. Abre la app → Menú (⋮) → "Agregar a pantalla de inicio"

**iPhone — Safari:**
1. Abre la app → Compartir (□↑) → "Agregar a pantalla de inicio"

La app funciona offline y recibirá alertas por correo como siempre.

---

## Estructura del proyecto

```
calendario-dian/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── dashboard/page.tsx              # Gestión de empresas/NITs
│   ├── vencimientos/page.tsx           # Vista global de vencimientos
│   └── api/cron/notificaciones/        # Endpoint de alertas email
├── components/
│   ├── LandingPage.tsx
│   ├── DashboardClient.tsx
│   ├── VencimientosGlobalesClient.tsx  # Vista global con filtros
│   ├── EmpresaForm.tsx
│   ├── EmpresasTable.tsx
│   └── ObligacionesModal.tsx
├── lib/
│   ├── dianLogic.ts          # Cálculo de vencimientos por NIT
│   ├── emailTemplates.ts     # HTML del correo de alerta
│   ├── empresas.ts           # CRUD de empresas
│   ├── schema.sql            # Schema Supabase (ejecutar 1 vez)
│   ├── types.ts              # Tipos TypeScript
│   └── supabase.ts / resend.ts
├── scripts/
│   └── seed-vencimientos.ts  # Datos de vencimientos 2026
├── public/
│   └── manifest.json         # PWA manifest
├── vercel.json               # Cron job diario
├── .env.local.example        # Plantilla de variables
└── ARQUITECTURA.md           # Diseño y roadmap
```

---

## Roadmap

**Fase 2**
- Autenticación con Supabase Auth (cada contador ve solo sus empresas)
- Notificaciones push en el celular (Web Push API)
- Exportar calendario a PDF
- Marcar estado por obligación: presentado / pagado / vencido

**Fase 3**
- Multi-usuario / firma contable
- App nativa React Native + Expo
- Integración Siigo / World Office
- Modelo freemium (hasta 5 NITs gratis)
