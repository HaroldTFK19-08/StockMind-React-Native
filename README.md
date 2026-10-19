# StockMind · App móvil

Gestor de inventario del SENA (Expo SDK 56 + Expo Router + NativeWind).

## Puesta en marcha

```bash
npm install
npx expo install expo-secure-store   # asegura la versión exacta para el SDK
cp .env.example .env                 # configura la URL del backend
npx expo start -c                    # -c limpia la caché (necesario tras cambiar .env)
```

Sin backend, deja `EXPO_PUBLIC_USE_MOCKS=true`: la app funciona con datos de prueba en memoria
y en el login aparecen botones para entrar con cada rol.

| Rol          | Correo                        | Contraseña     |
|--------------|-------------------------------|----------------|
| Administrador| adminsena@soy.sena.edu        | admin123       |
| Instructor   | instructorsena@soy.sena.edu   | instructor124  |
| Cuentadante  | dantesena@soy.sena.edu        | dante321       |
| Aprendiz     | aprendizsena@soy.sena.edu     | aprendiz2026   |

## Arquitectura modular por dominios

```
app/                     Solo rutas (Expo Router). Archivos de 1-5 líneas que montan pantallas.
  _layout.jsx            Providers + rutas protegidas por rol (Stack.Protected)
  auth/ admin/ instructor/ cuentaDante/ aprendiz/
src/
  core/                  Infraestructura, sin UI
    config/env.js        Variables EXPO_PUBLIC_*
    api/httpClient.js    fetch + token Bearer + timeout + errores + 401 → logout
    api/endpoints.js     ★ Todas las rutas del backend en un solo lugar
    api/mapping.js       Helpers para mappers (pick, relName…)
    api/mockCollection.js CRUD en memoria para modo demo
    storage/             Token en SecureStore (localStorage en web)
  shared/                Reutilizable por cualquier dominio
    ui/                  Design system: Button, TextField, SelectField, BottomSheet, ResourceList…
    hooks/               useResource, useMutation, useFilteredList
    utils/ theme/
  navigation/            Portales por rol: pestañas, header, menú lateral
  modules/               ★ Un módulo por dominio de negocio
    auth/ usuarios/ centros/ ambientes/ elementos/
    asignaciones/ traslados/ reportes/ notificaciones/ dashboard/
```

Cada módulo sigue la misma forma:

```
modules/elementos/
  elementos.service.js   Casos de uso (list, create, update…). Decide mock vs. API.
  elementos.mapper.js    Traduce backend ⇄ app. ★ Aquí se adapta si tu API usa otros nombres.
  elementos.mock.js      Datos de demostración
  elementos.constants.js Estados, categorías, íconos
  components/            Card, Detail, Form del dominio
  screens/               Pantallas completas, configurables por props
  index.js               API pública del módulo
```

Reglas: `app/` no contiene lógica; las pantallas nunca llaman a `fetch`, siempre a un `*.service.js`;
los componentes trabajan con el modelo de la app (camelCase) y solo el mapper conoce el formato del backend.

## Conectar el backend

1. En `.env`: `EXPO_PUBLIC_API_URL=http://<host>:<puerto>/api/v1` y `EXPO_PUBLIC_USE_MOCKS=false`
   (ver `.env.example`). Reinicia siempre con `npx expo start -c` después de cambiar `.env`.
2. Si la URL usa `localhost`, en celular físico se reemplaza sola por la IP de tu PC (la misma de Expo)
   y en el emulador Android por `10.0.2.2`. Arranca Laravel con `php artisan serve --host=0.0.0.0 --port=8000`.
3. Con `EXPO_PUBLIC_API_DEBUG=true` la consola de Metro muestra cada petición, su estado y la respuesta
   (las contraseñas se ocultan). Al arrancar se imprime la URL que la app está usando.
4. Si tus rutas son distintas, edita `src/core/api/endpoints.js`.
5. Si los nombres de campos son distintos, edita el `*.mapper.js` del módulo.
6. Habilita CORS en el backend si vas a probar en web.

Las respuestas pueden venir como arreglo directo o envueltas en `{ data }`, `{ results }`, `{ items }`.
Los errores se leen de `message`, `mensaje`, `error` o `detail`; en validaciones de Laravel (422)
se muestran los mensajes de `errors` y quedan disponibles por campo en `error.fieldErrors`.

### Contrato esperado (sugerido)

Todas las rutas (salvo login/registro) reciben `Authorization: Bearer <token>`.

| Método | Ruta | Cuerpo / respuesta |
|---|---|---|
| POST | `/auth/login` | `{ correo, contrasena }` → `{ token, user }` |
| POST | `/auth/register` | `{ nombre, documento, correo, contrasena, rol }` → `{ user }` (o `{ token, user }`) |
| GET | `/auth/me` | usuario autenticado |
| GET | `/dashboard/resumen` | contadores según el rol del token (ver `dashboard.mapper.js`) |
| GET | `/usuarios?rol=aprendiz` | lista de usuarios |
| GET / POST | `/centros` | `{ nombre, ubicacion, direccion, telefono? }` |
| GET | `/ambientes?centro_id=` | lista de ambientes |
| GET / POST | `/elementos?estado=&ambiente_id=` | `{ nombre, placa?, marca?, categoria, estado, descripcion, ambiente_id }` |
| PATCH | `/elementos/:id` | campos parciales, p. ej. `{ estado }` |
| GET / POST | `/asignaciones` | `{ aprendiz_id, elemento_id, fecha_inicio, fecha_fin, observaciones? }` |
| GET | `/asignaciones/mias` | asignaciones del aprendiz autenticado |
| PATCH | `/asignaciones/:id` | `{ estado: "Finalizada" }` |
| GET / POST | `/traslados` | `{ elemento_id, ambiente_destino_id, fecha_salida, fecha_llegada, motivo }` |
| PATCH | `/traslados/:id` | `{ estado: "En tránsito" \| "Entregado" }` |
| GET / POST | `/reportes` | `{ elemento_id, tipo, descripcion }` |
| GET | `/reportes/mios` | reportes creados por el usuario autenticado |
| PATCH | `/reportes/:id` | `{ estado, respuesta? }` |
| GET | `/notificaciones` | lista |
| PATCH | `/notificaciones/:id/leida` · `/notificaciones/leer-todas` | — |

Fechas en formato ISO `AAAA-MM-DD`. Roles aceptados en cualquier forma
(`ADMIN`, `Administrador`, `cuenta_dante`, `{ nombre: "Instructor" }`…); los normaliza `auth/roles.js`.

## Agregar un dominio nuevo

1. Crea `src/modules/<dominio>/` copiando la forma de `centros/` (el más simple).
2. Agrega sus rutas en `src/core/api/endpoints.js`.
3. Crea el archivo de ruta en `app/<rol>/<pantalla>.jsx` y, si es pestaña, regístrala en `src/navigation/portals.js`.
