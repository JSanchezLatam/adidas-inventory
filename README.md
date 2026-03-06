# Bodega adidas — Sistema de Inventario

App web PWA para rastrear la ubicacion de productos en bodega. Escanea o busca un producto y ve en que anaquel y nivel esta.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** — base de datos PostgreSQL + autenticacion
- **Tailwind CSS** — UI mobile-first
- **@zxing/browser** — escaner de codigo de barras/QR via camara
- **TanStack Query** — cache offline
- **Vercel** — deploy

---

## Setup: Paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En el SQL Editor, ejecuta **`supabase/schema.sql`** (crea todas las tablas y politicas RLS)
3. Luego ejecuta **`supabase/seed.sql`** para cargar los anaqueles iniciales

### 2. Crear el primer usuario admin

En el Dashboard de Supabase → Authentication → Users:
1. Crea un nuevo usuario con email y contrasena
2. Luego en el SQL Editor ejecuta:

```sql
update public.user_profiles
set role = 'admin', name = 'Tu Nombre'
where username = 'tu-email@ejemplo.com';
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y llena los valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Los encuentras en: Supabase Dashboard → Settings → API

### 4. Instalar y correr

```bash
npm install
npm run dev
```

---

## Deploy en Vercel

1. Conecta el repo en vercel.com
2. Agrega las 3 variables de entorno en Vercel → Settings → Environment Variables
3. Deploy

### Instalar como app (PWA)

- **Android:** Chrome → menu "..." → "Anadir a pantalla de inicio"
- **iOS:** Safari → boton compartir → "En pantalla de inicio"

---

## Importar productos desde CSV

Columnas soportadas (primera fila = encabezado):

| Columna | Requerida |
|---------|-----------|
| `sku` | Si |
| `name` | Si |
| `barcode` | No |
| `reference` | No |
| `size` | No |
| `color` | No |
| `category` | No |

---

## Estructura de anaqueles

Cada anaquel tiene 3 niveles: `ALTO`, `MEDIO`, `BAJO`

Para agregar anaqueles: Admin → Anaqueles → "+ Nuevo"
