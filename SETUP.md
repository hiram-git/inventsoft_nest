# InventSoft ERP — Guía de Instalación y Configuración

Este documento cubre todo lo necesario para instalar, configurar y ejecutar el proyecto en un entorno de desarrollo local.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar el repositorio](#2-clonar-el-repositorio)
3. [Instalar dependencias](#3-instalar-dependencias)
4. [Configurar variables de entorno](#4-configurar-variables-de-entorno)
5. [Configurar la base de datos](#5-configurar-la-base-de-datos)
6. [Configurar Redis](#6-configurar-redis)
7. [Configurar Clerk (autenticación)](#7-configurar-clerk-autenticación)
8. [Ejecutar migraciones](#8-ejecutar-migraciones)
9. [Iniciar el proyecto](#9-iniciar-el-proyecto)
10. [Verificar que todo funciona](#10-verificar-que-todo-funciona)
11. [Opciones de infraestructura](#11-opciones-de-infraestructura)
12. [Solución de problemas comunes](#12-solución-de-problemas-comunes)

---

## 1. Requisitos previos

### Node.js

Se requiere **Node.js 20 o superior**.

Verifica tu versión:

```bash
node --version
# Debe mostrar v20.x.x o superior
```

Opciones de instalación:
- **Windows / macOS**: Descarga el instalador desde [nodejs.org](https://nodejs.org)
- **Con NVM** (recomendado para manejar múltiples versiones):
  ```bash
  nvm install 20
  nvm use 20
  ```
- **Laragon (Windows)**: incluye Node.js. Actívalo desde el panel de Laragon → `Menu > Node.js`.

---

### pnpm

Este proyecto usa **pnpm 10** como gestor de paquetes (no npm ni yarn).

```bash
npm install -g pnpm@10
```

Verifica la instalación:

```bash
pnpm --version
# Debe mostrar 10.x.x
```

---

### Git

```bash
git --version
```

Si no está instalado: [git-scm.com](https://git-scm.com)

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/hiram-git/inventsoft_nest.git
cd inventsoft_nest
```

---

## 3. Instalar dependencias

Desde la raíz del monorepo, instala todas las dependencias de todos los paquetes y aplicaciones:

```bash
pnpm install
```

> Esto instala automáticamente las dependencias de `apps/web`, `apps/api`, `packages/shared`, `packages/domain` y `packages/infrastructure`.

---

## 4. Configurar variables de entorno

El proyecto tiene **dos archivos de entorno** que debes crear manualmente (nunca se suben al repositorio por seguridad).

### 4.1 API — `apps/api/.env`

Crea el archivo `apps/api/.env` con el siguiente contenido y ajusta los valores:

```env
# Entorno
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Base de datos PostgreSQL
DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/inventsoft_erp?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Clerk — clave secreta del servidor
CLERK_SECRET_KEY=sk_test_TU_CLAVE_AQUI

# CORS — URL del frontend
WEB_URL=http://localhost:3000
```

**Valores a reemplazar:**
| Variable | Valor |
|---|---|
| `USUARIO` | Usuario de PostgreSQL (ej: `postgres`) |
| `PASSWORD` | Contraseña de PostgreSQL (dejar vacío si no tiene) |
| `CLERK_SECRET_KEY` | Clave secreta de tu aplicación en [clerk.com](https://clerk.com) |

---

### 4.2 Web — `apps/web/.env.local`

Crea el archivo `apps/web/.env.local`:

```env
# Clerk — claves del frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
CLERK_SECRET_KEY=sk_test_TU_CLAVE_AQUI

# Rutas de autenticación Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# URL del API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 5. Configurar la base de datos

El proyecto requiere **PostgreSQL 14 o superior**.

### Opción A — Laragon (Windows) ✅ Recomendado para Windows

1. Abre Laragon y asegúrate de que PostgreSQL esté activado.
2. Abre **HeidiSQL** (incluido en Laragon) o cualquier cliente de base de datos.
3. Conéctate con:
   - Host: `localhost`
   - Puerto: `5432`
   - Usuario: `postgres`
   - Contraseña: *(vacía por defecto en Laragon)*
4. Crea la base de datos:
   ```sql
   CREATE DATABASE inventsoft_erp;
   ```
5. Actualiza `DATABASE_URL` en `apps/api/.env`:
   ```
   DATABASE_URL="postgresql://postgres:@localhost:5432/inventsoft_erp?schema=public"
   ```

---

### Opción B — PostgreSQL instalado directamente

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb inventsoft_erp
```

**Ubuntu / Debian:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb inventsoft_erp
```

**Windows (instalador oficial):**
Descarga desde [postgresql.org/download/windows](https://www.postgresql.org/download/windows) e instala con el asistente. Luego crea la base de datos con pgAdmin.

---

### Opción C — Neon (cloud gratuita, sin instalación)

1. Crea una cuenta en [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto → copia el connection string
3. Pégalo directamente en `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://usuario:password@ep-xxx.region.aws.neon.tech/inventsoft_erp?sslmode=require"
   ```

> Con Neon no necesitas instalar ni PostgreSQL ni Redis local.

---

## 6. Configurar Redis

### Opción A — Laragon (Windows)

Laragon incluye Redis. Actívalo desde:
`Menu > Redis > Start`

Por defecto corre en `localhost:6379` sin contraseña. No necesitas cambiar nada en el `.env`.

---

### Opción B — Redis instalado directamente

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu / Debian:**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**Verificar que Redis está corriendo:**
```bash
redis-cli ping
# Respuesta esperada: PONG
```

---

### Opción C — Upstash (cloud gratuita, sin instalación)

1. Crea una cuenta en [upstash.com](https://upstash.com)
2. Crea una base de datos Redis → copia los datos de conexión
3. Actualiza en `apps/api/.env`:
   ```env
   REDIS_HOST=tu-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=tu-password
   ```

---

## 7. Configurar Clerk (autenticación)

Clerk es el servicio de autenticación del proyecto. El tier gratuito soporta hasta 10.000 usuarios activos/mes.

1. Crea una cuenta en [clerk.com](https://clerk.com)
2. Crea una nueva aplicación:
   - Nombre: `InventSoft ERP`
   - Método de login: Email + contraseña (o Google si prefieres)
3. Ve a **API Keys** en el dashboard de Clerk
4. Copia:
   - `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` en `apps/web/.env.local`
   - `Secret key` → `CLERK_SECRET_KEY` en ambos `.env`

---

## 8. Ejecutar migraciones

Las migraciones crean todas las tablas en la base de datos.

```bash
pnpm --filter @inventsoft/infrastructure db:migrate
```

Cuando el comando lo solicite, ingresa un nombre para la migración:
```
Enter a name for the new migration: init
```

> Este comando crea todas las tablas: `products`, `warehouses`, `stock_items`, `stock_movements`, `suppliers`, `purchase_orders`, `purchase_order_items`, `customers`, `sale_orders`, `sale_order_items`.

Para verificar que las tablas se crearon correctamente, puedes abrir Prisma Studio:

```bash
pnpm --filter @inventsoft/infrastructure db:studio
# Abre una interfaz visual en http://localhost:5555
```

---

## 9. Iniciar el proyecto

Desde la raíz del monorepo, inicia todas las aplicaciones en paralelo:

```bash
pnpm dev
```

Turborepo levanta ambas apps automáticamente:

| Servicio | URL |
|---|---|
| Frontend (Next.js) | [http://localhost:3000](http://localhost:3000) |
| API (NestJS) | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) |
| Documentación Swagger | [http://localhost:3001/docs](http://localhost:3001/docs) |

Para iniciar solo una aplicación:

```bash
pnpm --filter @inventsoft/api dev      # Solo el API
pnpm --filter @inventsoft/web dev      # Solo el frontend
```

---

## 10. Verificar que todo funciona

### 10.1 API

Abre [http://localhost:3001/api/v1/warehouses](http://localhost:3001/api/v1/warehouses) en el navegador.

Respuesta esperada:
```json
[]
```

O prueba directamente con curl:
```bash
curl http://localhost:3001/api/v1/warehouses
```

También puedes explorar todos los endpoints en Swagger: [http://localhost:3001/docs](http://localhost:3001/docs)

---

### 10.2 Frontend

1. Abre [http://localhost:3000](http://localhost:3000)
2. Debe mostrar la pantalla de bienvenida con los botones **Iniciar sesión** y **Registrarse**
3. Regístrate o inicia sesión con Clerk
4. Serás redirigido al dashboard en `/dashboard`

---

### 10.3 Flujo de prueba completo

Para verificar que el core de inventario funciona:

1. **Almacén**: Ve a `/dashboard/warehouses` → Crea un almacén
2. **Producto**: Ve a `/dashboard/products` → Crea un producto con SKU y precios
3. **Ingreso manual**: Ve a `/dashboard/inventory` → **Ingresar mercancía** → selecciona producto y almacén
4. **Verificar stock**: La tabla de stock debe mostrar la cantidad ingresada
5. **Movimiento registrado**: Cambia a la pestaña **Movimientos** → debe aparecer el ingreso de tipo `Entrada`

Para probar el flujo de compras:

1. **Proveedor**: `/dashboard/suppliers` → Crea un proveedor
2. **Orden de compra**: `/dashboard/purchases/new` → Crea una OC con ítems
3. **Flujo completo**: En la lista → **Enviar** → **Aprobar** → **Recibir**
4. Al recibir, selecciona el almacén → el stock se actualiza automáticamente

---

## 11. Opciones de infraestructura

### Resumen comparativo

| | Laragon | Instalación directa | Cloud (Neon + Upstash) | Docker |
|---|---|---|---|---|
| **Facilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Sistema** | Solo Windows | Multiplataforma | Multiplataforma | Multiplataforma |
| **Sin instalación** | No | No | ✅ Sí | No |
| **Offline** | ✅ Sí | ✅ Sí | No | ✅ Sí |
| **Costo** | Gratuito | Gratuito | Gratuito (tier básico) | Gratuito |

### Opción Docker (si prefieres contenedores)

El proyecto incluye un `docker-compose.yml` listo para usar:

```bash
docker compose up -d
```

Esto levanta:
- PostgreSQL 16 en el puerto `5432`
- Redis 7 en el puerto `6379`
- Redis Commander (interfaz visual) en [http://localhost:8081](http://localhost:8081)

El `docker-compose.override.yml` agrega pgAdmin en [http://localhost:5050](http://localhost:5050).

---

## 12. Solución de problemas comunes

### `Cannot connect to database`

- Verifica que PostgreSQL está corriendo: `pg_isready -h localhost -p 5432`
- Verifica que la base de datos `inventsoft_erp` existe
- Confirma el usuario y contraseña en `DATABASE_URL`
- En Laragon, asegúrate de que el servicio PostgreSQL está activo (ícono verde)

---

### `Redis connection refused`

- Verifica que Redis está corriendo: `redis-cli ping` → debe responder `PONG`
- En Laragon: `Menu > Redis > Start`
- Confirma que `REDIS_HOST=localhost` y `REDIS_PORT=6379` en `apps/api/.env`

---

### `Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set`

- Verifica que el archivo `apps/web/.env.local` existe (no `.env`)
- El archivo debe estar en `apps/web/`, no en la raíz del proyecto
- Reinicia el servidor de desarrollo después de modificar variables de entorno

---

### `prisma generate` falla

Ejecuta el generate manualmente:

```bash
pnpm --filter @inventsoft/infrastructure db:generate
```

---

### Puerto 3000 o 3001 ya en uso

Termina el proceso que usa el puerto:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS / Linux
lsof -ti:3001 | xargs kill
```

---

### `pnpm: command not found`

```bash
npm install -g pnpm@10
```

Si usas nvm, asegúrate de haber corrido `nvm use 20` primero.

---

## Estructura del proyecto

```
inventsoft_nest/
├── apps/
│   ├── api/          # NestJS — API REST (puerto 3001)
│   └── web/          # Next.js 15 — Frontend (puerto 3000)
├── packages/
│   ├── shared/       # Tipos, DTOs, esquemas Zod compartidos
│   ├── domain/       # Entidades DDD, value objects, domain events
│   └── infrastructure/ # Prisma schema, Redis, BullMQ
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Comandos de referencia rápida

```bash
# Instalar dependencias
pnpm install

# Iniciar todo en desarrollo
pnpm dev

# Migraciones de base de datos
pnpm --filter @inventsoft/infrastructure db:migrate

# Generar cliente Prisma
pnpm --filter @inventsoft/infrastructure db:generate

# Abrir Prisma Studio (explorar datos)
pnpm --filter @inventsoft/infrastructure db:studio

# Build de producción
pnpm build

# Solo el API
pnpm --filter @inventsoft/api dev

# Solo el frontend
pnpm --filter @inventsoft/web dev
```
