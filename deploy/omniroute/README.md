# Pouya → OmniRoute deployment

This directory is intentionally isolated from the Vercel application. It does not change the current production API path until an OmniRoute endpoint has been provisioned and tested.

## Target architecture

`Pouya (Vercel) → HTTPS endpoint → OmniRoute (Oracle Always Free VM) → authorized AI providers`

## Oracle VM target

Use an Always Free `VM.Standard.A1.Flex` Ubuntu instance within the current tenancy allowance. As of June 15, 2026, Oracle's Always Free allowance is 2 OCPUs / 12 GB RAM total for A1, so do not provision the old 4 OCPU / 24 GB configuration.

## Install

On the VM:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin curl
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out/in once after adding the user to the docker group.

Then:

```bash
git clone https://github.com/mhosseinbaghaee-byte/prairie-pine-drift-earth.git
cd prairie-pine-drift-earth/deploy/omniroute
cp .env.example .env
nano .env
chmod 600 .env
docker compose pull
docker compose up -d
```

The compose file deliberately binds port 20128 to `127.0.0.1`, not the public internet.

## First verification

```bash
curl -I http://127.0.0.1:20128
curl http://127.0.0.1:20128/v1/models
```

Do not connect Pouya yet. First verify the OmniRoute dashboard and `/v1/models` locally and configure only providers whose terms permit the intended use.

## Public HTTPS

After the local service is healthy, put it behind a Cloudflare Tunnel or another authenticated HTTPS reverse proxy. Do not expose `:20128` directly. Only after the HTTPS endpoint is working should the Pouya Vercel server function be switched to an OmniRoute-compatible base URL.

## Rollback rule

The current Pouya provider code is not replaced by this directory. If OmniRoute is unavailable, Pouya keeps its existing provider/local fallback path. The OmniRoute cutover should happen only after a successful end-to-end test.
