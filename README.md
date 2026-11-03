# BlessBoard

白色無邊際格子白板 + 內建 Blessas v1 AI

## Features

- Infinite white grid whiteboard (tldraw)
- Built-in Blessas v1 (NVIDIA Nemotron) that can directly operate the canvas
- Custom share links: `blbd.huhm.cc/d/{slug}`
- Turso database
- MCP tools ready

## Environment Variables

```bash
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
AI_API_KEY=
AI_BASE_URL=https://integrate.api.nvidia.com/v1
AI_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
```

## Develop

```bash
npm install
npm run dev
```
