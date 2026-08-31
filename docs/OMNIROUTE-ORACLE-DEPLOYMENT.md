# OmniRoute + Oracle Cloud Always Free for Pouya

This guide deploys OmniRoute as a private OpenAI-compatible gateway for the Pouya app.

## Target architecture

Pouya (Vercel) -> HTTPS/Cloudflare -> Nginx -> OmniRoute :20128 -> AI providers

## 1. Oracle Cloud VM

Create an **OCI Ampere A1 Flex** VM in the account's home region:

- Ubuntu 24.04 LTS
- 2 OCPU
- 12 GB RAM
- 50 GB boot volume is sufficient
- Public IPv4 enabled

Oracle's Always Free A1 allowance is 2 OCPUs / 12 GB RAM equivalent. If OCI reports out-of-host-capacity, retry another availability domain or later.

## 2. Open only SSH/HTTP/HTTPS

On the VM:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx docker.io openssl fail2ban
sudo systemctl enable --now docker nginx fail2ban

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Also add OCI Security List / Network Security Group ingress rules for TCP 22, 80 and 443 only. Do NOT expose 20128 publicly.

## 3. OmniRoute secrets

```bash
sudo mkdir -p /opt/omniroute
cd /opt/omniroute

openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

Create `/opt/omniroute/.env` with the generated values:

```dotenv
JWT_SECRET=GENERATED_VALUE_1
API_KEY_SECRET=GENERATED_VALUE_2
STORAGE_ENCRYPTION_KEY=GENERATED_VALUE_3
MACHINE_ID_SALT=GENERATED_VALUE_4
STORAGE_ENCRYPTION_KEY_VERSION=v1

INITIAL_PASSWORD=CHANGE_THIS_TO_A_LONG_UNIQUE_PASSWORD

PORT=20128
NODE_ENV=production
HOSTNAME=0.0.0.0
DATA_DIR=/app/data
STORAGE_DRIVER=sqlite
APP_LOG_TO_FILE=true

# Set these after choosing the public hostname.
BASE_URL=https://ai.example.com
NEXT_PUBLIC_BASE_URL=https://ai.example.com

# Keep the gateway behind nginx; do not expose 20128 to the Internet.
AUTH_COOKIE_SECURE=true
REQUIRE_API_KEY=true
```

```bash
sudo chmod 600 /opt/omniroute/.env
```

## 4. Start OmniRoute

```bash
sudo docker pull diegosouzapw/omniroute:latest
sudo docker run -d \
  --name omniroute \
  --restart unless-stopped \
  --stop-timeout 40 \
  --env-file /opt/omniroute/.env \
  -p 127.0.0.1:20128:20128 \
  -v omniroute-data:/app/data \
  diegosouzapw/omniroute:latest

sudo docker ps | grep omniroute
sudo docker logs omniroute --tail 30
```

Expected logs include SQLite being ready and the service listening on port 20128.

## 5. First local test

On the VM:

```bash
curl -i http://127.0.0.1:20128/
```

Open the dashboard through an SSH tunnel if needed:

```bash
ssh -L 20128:127.0.0.1:20128 ubuntu@SERVER_IP
```

Then open `http://localhost:20128` on the local computer.

## 6. Configure providers

Use the OmniRoute dashboard -> Providers.

For Pouya, start conservatively with providers whose current terms permit the intended use. Good candidates to evaluate are Gemini, Groq, Cerebras, Cloudflare AI, and other current free-tier entries. Do not enable entries marked `tos: avoid` merely to increase the token number.

Use `model: auto` for routing/fallback after at least two compatible providers are connected.

## 7. Public HTTPS

Recommended production path:

Cloudflare DNS -> Nginx :443 -> 127.0.0.1:20128

Create a Cloudflare DNS record such as:

`ai.example.com -> SERVER_IP` with proxy enabled.

Use a Cloudflare Origin Certificate on the VM and configure nginx to proxy `/v1/` and the dashboard to OmniRoute. Keep port 20128 bound to localhost only.

## 8. Temporary test without a domain

For a short-lived test only, OmniRoute's Docker deployment supports a Cloudflare Quick Tunnel. The generated `trycloudflare.com` URL changes after restart and must not be treated as the permanent Pouya endpoint.

## 9. Pouya integration

After the gateway is reachable over HTTPS, add these Vercel environment variables:

```text
OMNIROUTE_BASE_URL=https://ai.example.com/v1
OMNIROUTE_API_KEY=<scoped OmniRoute API key>
```

The Pouya server-side API should call OmniRoute using the OpenAI-compatible API rather than exposing any provider API key to the browser.

Recommended request shape:

```json
{
  "model": "auto",
  "messages": [
    {"role":"system","content":"..."},
    {"role":"user","content":"..."}
  ]
}
```

## 10. Security checklist

- Never commit provider keys or OmniRoute secrets to GitHub.
- Never expose TCP 20128 publicly.
- Require an OmniRoute API key for Pouya.
- Use HTTPS only for the Vercel -> gateway connection.
- Keep the dashboard password unique.
- Back up the `omniroute-data` volume before upgrades.
- Review each provider's current ToS/privacy before enabling it.

## Rollback

If OmniRoute is unavailable, Pouya can temporarily fall back to its existing Gemini path by removing `OMNIROUTE_BASE_URL` from the production environment and redeploying.
