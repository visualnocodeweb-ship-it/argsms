# Mensajes ARG

Plataforma de automatización de envío de mensajes SMS para Argentina.  
Producto comercial sobre [httpSMS](https://httpsms.com): usás un Android con chip propio como puerta de SMS.

## Qué incluye

- **Frontend** (React + Vite): landing de venta + zona admin
- **Backend** (FastAPI): auth, dispositivos, contactos, mensajes individuales/masivos, stats
- Integración con API de httpSMS (o modo simulación sin API key)

## Arranque rápido

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # o cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

Credenciales demo:

- Email: `demo@mensajesarg.com`
- Password: `demo123`

Proyecto **FaunaNQN** (operador dedicado):

- Usuario: `faunanqn` o `faunanqn@mensajesarg.com`
- Password: `faunanqnadmin`

Proyecto **Botón Rojo** (operador dedicado):

- Usuario: `botonrojo` o `botonrojo@mensajesarg.com`
- Password: `botonrojoadmin`

### Frontend

Si el proyecto está en un share de red (`\\servidor\...`), en Windows usá `pushd` para mapear unidad (npm/esbuild no bancan rutas UNC):

```bash
cmd /c "pushd \\FAUNQN\Public\Codigos\Plataforma_Mensajes\frontend && npm install && npm run dev"
```

O desde una copia local:

```bash
cd frontend
npm install
npm run dev
```

Sitio: http://127.0.0.1:5173  
Admin: http://127.0.0.1:5173/admin

El frontend hace proxy de `/api` al backend en el puerto 8000.

## httpSMS

1. Instalá httpSMS en un Android con SIM y plan SMS
2. Configurá la API key en `backend/.env` (`HTTPSMS_API_KEY`)
3. Registrá el número del dispositivo en **Admin → Dispositivos**

Sin API key, los envíos se guardan en **modo simulación** para probar el panel.

## Estructura

```
backend/app/          FastAPI (auth, devices, messages, contacts, admin)
frontend/src/         Landing + panel admin
```
