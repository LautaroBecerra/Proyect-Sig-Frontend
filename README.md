# Proyect-Sig-Frontend

Frontend del sistema de reporte y visualización de inundaciones. Angular +
Ionic + TypeScript, consumiendo la API REST de `Proyect-Sig` (Node/Express +
PostgreSQL/PostGIS).

Este es un proyecto **completo y ejecutable** — no hace falta correr
`ionic start`, ya está todo armado (equivalente a lo que generaría el CLI,
más la funcionalidad de mapa ya integrada).

## Requisitos

- Node.js 18 o superior
- npm

## Puesta en marcha

```bash
npm install
npm start
```

`npm install` va a instalar todas las dependencias y, automáticamente
(vía el script `postinstall`), copiar los íconos de Leaflet a
`src/assets/leaflet/` — no hace falta hacerlo a mano.

`npm start` levanta el servidor de desarrollo en:

```
http://localhost:8100
```

Asegurate de tener el backend (`Proyect-Sig`) corriendo en paralelo en
`http://localhost:3000` (`npm run dev` en ese repo, o el comando que uses ahí).

Si el navegador tira errores de CORS al llamar a `http://localhost:3000/api`,
hay que habilitar CORS en el backend para `http://localhost:8100` (paquete
`cors` de Express).

## Qué incluye este primer entregable

- Mapa Leaflet + OpenStreetMap a pantalla completa como página principal
  (`/map`, y `/` redirige ahí).
- Centra el mapa en la ubicación real del usuario (con fallback si no hay
  permiso de geolocalización).
- Carga y pinta los reportes existentes como marcadores
  (`GET /api/flood-reports`).
- Tocar un marcador muestra severidad, descripción, fecha y usuario del
  reporte (solo informativo por ahora — el backend todavía no tiene
  endpoint de confirmar/votar).
- Botón flotante (+) activa el modo "elegir ubicación": tocás el mapa y se
  abre un formulario simple para crear el reporte
  (`POST /api/flood-reports`), con un campo temporal de `user_id` hasta que
  exista login.
- Botón flotante de "ubicarme" para recentrar el mapa en tu posición actual.
- Manejo de errores HTTP (400/401/403/404/500/sin conexión) con `ion-toast`,
  sin mostrar errores técnicos crudos al usuario.
- Spinner de carga mientras se piden los reportes.

## Estructura

```
src/
├── app/
│   ├── app.component.*        Componente raíz (ion-app + router-outlet)
│   ├── app.config.ts          Providers globales (router, http, ionic)
│   ├── app.routes.ts          Rutas (por ahora solo /map)
│   ├── models/                Interfaces alineadas 1:1 con el backend
│   ├── services/               AuthService, FloodReportService, LocationService, etc.
│   └── pages/
│       └── map/                Página principal con el mapa Leaflet
├── environments/               URL del backend centralizada
├── theme/variables.scss        Paleta de colores de Ionic
└── global.scss                 CSS global (Ionic + Leaflet)
```

Las carpetas `core/`, `shared/`, `guards/`, `interceptors/` de la
arquitectura planteada todavía no tienen contenido — se van a ir llenando
a medida que entren autenticación, componentes reutilizables y validadores.

## API — confirmado contra el backend real (`Proyect-Sig`, rama `Crud-flood.repots`)

- Prefijo real: `/api/flood-reports`.
- Respuestas envueltas en `{ success, message?, data }` (ya desempaquetado
  en `FloodReportService`).
- Endpoints existentes:
  - `GET    /api/flood-reports`
  - `GET    /api/flood-reports/user/:userId`
  - `GET    /api/flood-reports/:id`
  - `POST   /api/flood-reports`
  - `PUT    /api/flood-reports/:id`
  - `DELETE /api/flood-reports/:id`
- Campos del modelo (snake_case, tal cual la API):
  `id, user_id, latitude, longitude, description, severity, created_at`.
  No hay `status` ni `updatedAt`.
- `CreateFloodReport`: `user_id`, `latitude`, `longitude` obligatorios
  (el backend valida rangos: lat -90..90, lng -180..180).
  `description` y `severity` opcionales.
- `UpdateFloodReport`: **no** permite tocar `user_id`.
- **No existe todavía** endpoint de confirmar/votar reportes — por eso el
  frontend no lo llama.

### Pendiente

- Como todavía no hay login, el formulario de creación pide un `user_id`
  numérico "temporal" (por defecto `1`). Sacar ese campo en cuanto exista
  `AuthService` + `AuthGuard`, y completarlo automáticamente con el usuario
  autenticado.

## Preparado para Android (Capacitor)

Ya está `capacitor.config.ts` armado (`webDir: 'www'`, que es el output de
`npm run build`). Para probarlo en Android más adelante:

```bash
npm install -g @ionic/cli
npm run build
npx cap add android
npx cap open android
```

## Próximos pasos sugeridos

- Login/Register + `AuthGuard` + `HttpInterceptor` (cuando el backend tenga auth).
- Página de listado/detalle de reportes (`pages/flood-reports`).
- Filtro de reportes por zona.
- Componentes reutilizables (`FloodReportCard`, `ConfirmDialog`, etc.) en `shared/`.
