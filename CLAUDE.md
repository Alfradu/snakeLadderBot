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
```

These are consumed via `dotenv` at startup. The bot will fail silently or crash without them.

## Architecture

The entire bot lives in [src/main.ts](src/main.ts) (~52 lines). It is a Discord.js v14 bot with a single-purpose flow:

1. **Startup:** Connects to Discord, caches the target text channel (stored in the `channel` variable).
2. **`messageCreate` handler:** Watches the configured CHANNEL for messages with attachments from non-bots. On match, auto-reacts with 🐍 and starts a reaction collector.
3. **Reaction collector:** Waits for 2 non-bot, non-author 🐍 reactions. On completion (`end` event with reason `"limit"`), announces the bounty as completed. Otherwise announces low engagement.

**Required Discord gateway intents:** `Guilds`, `GuildMessages`, `MessageContent`, `GuildMessageReactions`  
**Required partials:** `User`, `Message`, `Channel`, `Reaction` (needed for reaction events on cached/uncached messages)

## CI/CD

`.github/workflows/docker-image.yml` builds and pushes a Docker image to Docker Hub on every push/PR to `main`. It creates the `.env` from GitHub Secrets (`TOKEN`, `GUILD`, `CHANNEL`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) during the build and removes it afterward. Images are tagged as both `slb-{unix_timestamp}` and `latest`.

## Module System Note

`package.json` declares `"type": "module"` (ESM) but `tsconfig.json` targets `CommonJS`. `tsx` bridges this at runtime. If compiling with `tsc` directly, output goes to `./build/`.
