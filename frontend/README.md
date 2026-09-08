# CSLM Frontend — Certificate & Secret Lifecycle Manager

Interfaz web de CSLM: consulta y gestión del inventario de certificados y secretos, dashboard con
semáforo de vencimientos, próximos vencimientos, y vista gráfica de dependencias entre
certificados/secretos, aplicaciones, ambientes y ubicaciones de despliegue. Consume la API REST
del backend.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Material UI (MUI 5)** para la interfaz
- **React Router 6** para el enrutamiento
- **Axios** para el consumo de la API (token JWT en `localStorage`, interceptores para 401)
- **React Flow** para el grafo de dependencias

### Pantallas

Login · Dashboard · Certificates (listado / detalle / grafo) · Secrets (listado / detalle — el
valor real del secreto nunca se muestra) · Applications (listado / detalle agrupado por ambiente
+ grafo) · Environments (CRUD) · Notifications (histórico de correos) · Administration
(equipos, tipos de activo y ubicación, ubicaciones de despliegue, reglas de notificación,
umbrales del semáforo, usuarios).

## Requisitos

- **Node.js 20+** y npm

## Cómo iniciar en local

### Opción A — Servidor de desarrollo (Vite)

Requiere que el backend esté corriendo en http://localhost:8080 (ver `../backend/README.md` o
`docker compose up backend`).

```bash
npm install
npm run dev
```

La app queda en **http://localhost:5173**. Vite hace proxy de `/api` hacia el backend
(configurable con `VITE_DEV_API_TARGET`, ver `vite.config.ts`).

Iniciar sesión con alguno de los usuarios de ejemplo:

| Usuario  | Contraseña   | Rol      |
|----------|--------------|----------|
| admin    | Admin123!    | ADMIN    |
| operator | Operator123! | OPERATOR |
| viewer   | Viewer123!   | VIEWER   |

### Opción B — Docker Compose

Desde la raíz del repositorio (`../`), levanta frontend + backend + MySQL + MailHog:

```bash
cp ../.env.example ../.env
docker compose up --build
```

Frontend servido por nginx en **http://localhost:8081**; nginx hace proxy de `/api/` al servicio
`backend`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR (puerto 5173) |
| `npm run build` | Compila TypeScript y genera el build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` (puerto 4173) |
| `npm run lint` | Chequeo de tipos con `tsc --noEmit` |

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `VITE_API_BASE_URL` | `/api` | URL base de la API usada por Axios en tiempo de ejecución |
| `VITE_DEV_API_TARGET` | `http://localhost:8080` | Destino del proxy `/api` del servidor de desarrollo |

Con la configuración por defecto no hace falta definir ninguna: en desarrollo Vite hace proxy a
`localhost:8080` y en el contenedor nginx hace proxy al servicio `backend`.

## Docker

```bash
docker build -t cslm-frontend .
docker run --rm -p 8081:80 cslm-frontend
```

Build multi-stage: `node:22-alpine` compila el bundle, `nginx:1.27-alpine` lo sirve. El
enrutado SPA (`try_files ... /index.html`) y el proxy `/api/` están en `nginx.conf`.
