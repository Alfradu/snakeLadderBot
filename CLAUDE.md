# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Run bot:** `npm start` (uses `tsx` for on-the-fly TypeScript execution, no compile step needed)
- **No test or lint commands** are configured in this project.

## Environment

Create a `.env` file at the root with:

```
TOKEN="<discord bot token>"
GUILD="<discord server/guild ID>"
CHANNEL="<discord channel ID>"
PORT="1337"
API_KEY="<random secret for REST API auth>"
SUPABASE_URL="<supabase project URL>"
SUPABASE_ANON_KEY="<supabase anon key>"
```

These are consumed via `dotenv` at startup. The bot will fail silently or crash without them.

## Architecture

The bot is split across three files:

- **[src/main.ts](src/main.ts)** — entry point; wires bot and API together, calls `client.login()`.
- **[src/bot.ts](src/bot.ts)** — Discord client setup, shared `state` singleton (`{ client, channel }`), and `registerBotHandlers()`. The `messageCreate` handler (currently commented out) watched for user-posted images; the API flow is the active path.
- **[src/api.ts](src/api.ts)** — Express v5 app on `POST /bounty`. Requires `X-Api-Key` header matching `API_KEY`. Accepts `multipart/form-data` with `image` (file), `bountyId` (int), `playerId` (int), `contributorIds` (repeated field or comma-separated). Posts the image to Discord, seeds 🐍, creates a reaction collector, returns `202 { messageId }` immediately.

**Reaction collector (API flow):** waits for 2 non-bot 🐍 reactions on the bot-posted message. On `"limit"` → announces verification. Otherwise → announces low engagement. A DB update hook is stubbed with a `TODO` comment in the `"limit"` branch.

**Required Discord gateway intents:** `Guilds`, `GuildMessages`, `MessageContent`, `GuildMessageReactions`  
**Required partials:** `User`, `Message`, `Channel`, `Reaction` (needed for reaction events on cached/uncached messages)

## Deployment

The server runs via `docker-compose.yml`, which starts two containers:
- **bot** — the Discord bot + REST API (`${DOCKERHUB_USERNAME}/slb:latest`)
- **cloudflared** — Cloudflare Tunnel, proxies public HTTPS traffic to `bot:1337`

Set `CLOUDFLARE_TUNNEL_TOKEN` and `DOCKERHUB_USERNAME` in a `.env` on the server (not baked into the image), then `docker compose up -d`.

To configure the tunnel: create it in the Cloudflare Zero Trust dashboard → Tunnels, point the public hostname to `http://bot:1337`.

## CI/CD

`.github/workflows/docker-image.yml` builds and pushes a Docker image to Docker Hub on every push/PR to `main`. It bakes a `.env` from GitHub Secrets (`TOKEN`, `GUILD`, `CHANNEL`, `PORT`, `API_KEY`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) into the image and passes `PORT` as a build arg for `EXPOSE`. Images are tagged as both `slb-{unix_timestamp}` and `latest`.

## Module System Note

`package.json` declares `"type": "module"` (ESM) but `tsconfig.json` targets `CommonJS`. `tsx` bridges this at runtime. If compiling with `tsc` directly, output goes to `./build/`.
