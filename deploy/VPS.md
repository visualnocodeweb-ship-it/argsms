# Deploy Mensajes ARG (API + Postgres) en Hostinger VPS

Costo DB: **$0 extra** (Postgres en Docker en el KVM 2).

- API local: `http://127.0.0.1:8200`
- No pisa GPS (`8194`), cámaras (`8090`) ni n8n (`5678`)

## A) Desde tu PC (PowerShell)

```powershell
cd C:\Users\emanuel\Desktop\Plataforma_Mensajes

# Empaquetar backend (sin venv ni DB local)
tar -czf mensajes-backend.tgz `
  --exclude=.venv_local `
  --exclude=__pycache__ `
  --exclude=*.db `
  --exclude=.env `
  -C backend .

scp mensajes-backend.tgz root@72.62.106.38:/root/
scp deploy\nginx-mensajes-arg.conf root@72.62.106.38:/root/
```

## B) En el VPS (SSH)

```bash
mkdir -p /root/mensajes-arg
cd /root/mensajes-arg
tar -xzf /root/mensajes-backend.tgz

cp .env.production.example .env.production
nano .env.production
```

En `.env.production` cambiá:
- `SECRET_KEY`
- `ADMIN_PASSWORD`
- `POSTGRES_PASSWORD` **y** el mismo valor dentro de `DATABASE_URL`
- `HTTPSMS_API_KEY` (la de tu cuenta httpSMS)
- Más adelante: `CORS_ORIGINS` y `PUBLIC_APP_URL` con URLs de Vortex

```bash
docker compose up -d --build
docker compose ps
curl -s http://127.0.0.1:8200/api/health
docker compose logs -f api --tail=50
```

Si health responde `{"status":"ok",...}` → listo el backend + DB.

## C) Nginx (cuando tengas subdomain, ej. api.faunanqn.com)

```bash
nano /etc/nginx/sites-available/mensajes-arg
# pegá el contenido de /root/nginx-mensajes-arg.conf (ajustá server_name)
ln -sf /etc/nginx/sites-available/mensajes-arg /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.TU-DOMINIO.com
```
