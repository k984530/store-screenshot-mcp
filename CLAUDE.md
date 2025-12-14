# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server that generates App Store/Play Store screenshots with iPhone mockups, gradient backgrounds, and text overlays. Uses Sharp for image processing and the MCP SDK for Claude integration.

## Build & Run Commands

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript to dist/
npm run dev       # Run with tsx (development)
npm start         # Run compiled JavaScript
```

## Architecture

### Core Components

- **src/index.ts** - MCP server entry point. Registers tools with the MCP SDK, handles tool requests via `CallToolRequestSchema`. Tools: `generate_screenshot`, `generate_batch_screenshots`, `subscription_status`, `activate_subscription`, `deactivate_subscription`, `refresh_subscription`, `list_presets`, `list_devices`.

- **src/screenshot-generator.ts** - Image generation using Sharp. Creates SVG templates with gradients, iPhone mockup frames (Dynamic Island, home indicator, side buttons), and text overlays. Composites app screenshots into the mockup with rounded corner masking.

- **src/license-manager.ts** - Freemium subscription system. Tracks daily usage limits, manages Pro/Free feature flags. Config stored in `~/.store-screenshot-mcp/`. Subscription verification uses Gumroad API (with `GUMROAD_ACCESS_TOKEN`) or falls back to remote webhook server (`WEBHOOK_SERVER_URL`) then local file.

### Data Flow

1. MCP client calls tool via stdio transport
2. `index.ts` routes to appropriate handler
3. `LicenseManager` validates usage/plan restrictions
4. `ScreenshotGenerator.generate()` creates SVG base → composites screenshot → outputs PNG
5. Result returned as file path or base64

### Key Configurations

**Device dimensions** (App Store requirements):
- iPhone 15 Pro Max: 1290x2796
- iPhone 15 Pro: 1179x2556
- iPhone SE: 750x1334
- iPad Pro: 2048x2732

**Color presets**: purple, pink, blue, green, orange, dark, light (Free plan: purple, dark only)

**Plan restrictions** (in `license-manager.ts` PLAN_FEATURES):
- Free: 3 screenshots/day, watermark, limited presets/devices
- Pro: Unlimited, no watermark, all features

## MCP Registration

Add to project `.mcp.json` or global `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "store-screenshot": {
      "command": "node",
      "args": ["/path/to/store-screenshot-mcp/dist/index.js"]
    }
  }
}
```

## Environment Variables (optional)

- `GUMROAD_ACCESS_TOKEN` - Gumroad API token for direct subscription verification
- `WEBHOOK_SERVER_URL` - Custom webhook server URL (default: Railway-hosted server)

## Dependencies

- `@modelcontextprotocol/sdk` - MCP server framework
- `sharp` - Image processing (SVG rendering, compositing, resizing)
