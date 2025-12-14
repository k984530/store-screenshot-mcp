#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ScreenshotGenerator } from "./screenshot-generator.js";
import { LicenseManager } from "./license-manager.js";

// Initialize generator (includes license manager)
const generator = new ScreenshotGenerator();
const licenseManager = generator.getLicenseManager();

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "generate_screenshot",
    description: `Generate a Store ScreenShot with text overlay and iPhone mockup.

FREE PLAN: 3 screenshots/day, watermark, limited presets (purple, dark), iPhone 15 Pro Max only
PRO PLAN ($4.9/mo): Unlimited, no watermark, all presets & devices, batch generation, custom colors`,
    inputSchema: {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description: "Main headline text (first line)",
        },
        subheadline: {
          type: "string",
          description: "Sub-headline text (second line)",
        },
        screenshotPath: {
          type: "string",
          description: "Path to the app screenshot image file",
        },
        screenshotBase64: {
          type: "string",
          description: "Base64 encoded app screenshot (alternative to path)",
        },
        outputPath: {
          type: "string",
          description: "Path to save the generated screenshot",
        },
        device: {
          type: "string",
          enum: ["iphone-15-pro-max", "iphone-15-pro", "iphone-se", "ipad-pro"],
          description: "Device type (Free: iPhone 15 Pro Max only)",
        },
        preset: {
          type: "string",
          enum: ["purple", "pink", "blue", "green", "orange", "dark", "light"],
          description: "Color preset (Free: purple, dark only)",
        },
        bgColor1: {
          type: "string",
          description: "Custom gradient color 1 (Pro only)",
        },
        bgColor2: {
          type: "string",
          description: "Custom gradient color 2 (Pro only)",
        },
      },
      required: [],
    },
  },
  {
    name: "generate_batch_screenshots",
    description: "Generate multiple screenshots at once (PRO feature - $4.9/mo)",
    inputSchema: {
      type: "object",
      properties: {
        slides: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string" },
              subheadline: { type: "string" },
              screenshotPath: { type: "string" },
              screenshotBase64: { type: "string" },
            },
          },
          description: "Array of slide configurations",
        },
        outputDirectory: {
          type: "string",
          description: "Directory to save all generated screenshots",
        },
        device: { type: "string" },
        preset: { type: "string" },
        bgColor1: { type: "string" },
        bgColor2: { type: "string" },
      },
      required: ["slides", "outputDirectory"],
    },
  },
  {
    name: "subscription_status",
    description: "Check your current subscription status and usage",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "activate_subscription",
    description: "Activate a Pro subscription with your purchase email",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email used for Gumroad purchase",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "deactivate_subscription",
    description: "Deactivate your current subscription on this device",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_presets",
    description: "List available color presets for your plan",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_devices",
    description: "List available device mockups for your plan",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// All presets info
const ALL_PRESETS: Record<string, { color1: string; color2: string; description: string }> = {
  purple: { color1: "#667eea", color2: "#764ba2", description: "Purple gradient" },
  pink: { color1: "#f093fb", color2: "#f5576c", description: "Pink gradient" },
  blue: { color1: "#4facfe", color2: "#00f2fe", description: "Blue/Cyan gradient" },
  green: { color1: "#43e97b", color2: "#38f9d7", description: "Green gradient" },
  orange: { color1: "#fa709a", color2: "#fee140", description: "Orange/Yellow gradient" },
  dark: { color1: "#232526", color2: "#414345", description: "Dark gradient" },
  light: { color1: "#e0e5ec", color2: "#f5f7fa", description: "Light gradient" },
};

// All devices info
const ALL_DEVICES: Record<string, { width: number; height: number; description: string }> = {
  "iphone-15-pro-max": { width: 1290, height: 2796, description: "iPhone 15 Pro Max (6.7\")" },
  "iphone-15-pro": { width: 1179, height: 2556, description: "iPhone 15 Pro (6.1\")" },
  "iphone-se": { width: 750, height: 1334, description: "iPhone SE (4.7\")" },
  "ipad-pro": { width: 2048, height: 2732, description: "iPad Pro 12.9\"" },
};

async function main() {
  const server = new Server(
    {
      name: "store-screenshot-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "generate_screenshot": {
          const {
            headline = "",
            subheadline = "",
            screenshotPath,
            screenshotBase64,
            outputPath,
            device,
            preset,
            bgColor1,
            bgColor2,
          } = args as {
            headline?: string;
            subheadline?: string;
            screenshotPath?: string;
            screenshotBase64?: string;
            outputPath?: string;
            device?: string;
            preset?: string;
            bgColor1?: string;
            bgColor2?: string;
          };

          const result = await generator.generate({
            headline,
            subheadline,
            screenshotPath,
            screenshotBase64,
            outputPath,
            device,
            preset,
            bgColor1,
            bgColor2,
          });

          const watermarkNote = result.watermarked
            ? `\n\n⚠️ Watermark added (Free plan)\n🚀 Upgrade to Pro ($4.9/mo) to remove: ${licenseManager.purchaseUrl}`
            : "";

          return {
            content: [
              {
                type: "text",
                text: result.outputPath
                  ? `✅ Screenshot generated!\n\n📁 Saved: ${result.outputPath}\n📐 Size: ${result.width}x${result.height}\n📊 ${result.usageInfo}${watermarkNote}`
                  : `✅ Screenshot generated!\n\n📐 Size: ${result.width}x${result.height}\n📊 ${result.usageInfo}${watermarkNote}`,
              },
              ...(result.base64 && !result.outputPath
                ? [
                    {
                      type: "image" as const,
                      data: result.base64,
                      mimeType: "image/png" as const,
                    },
                  ]
                : []),
            ],
          };
        }

        case "generate_batch_screenshots": {
          const {
            slides,
            outputDirectory,
            device,
            preset,
            bgColor1,
            bgColor2,
          } = args as {
            slides: Array<{
              headline?: string;
              subheadline?: string;
              screenshotPath?: string;
              screenshotBase64?: string;
            }>;
            outputDirectory: string;
            device?: string;
            preset?: string;
            bgColor1?: string;
            bgColor2?: string;
          };

          const results = await generator.generateBatch({
            slides,
            outputDirectory,
            device,
            preset,
            bgColor1,
            bgColor2,
          });

          return {
            content: [
              {
                type: "text",
                text: `✅ Generated ${results.length} screenshots!\n\n${results.map((r, i) => `${i + 1}. ${r.outputPath}`).join("\n")}`,
              },
            ],
          };
        }

        case "subscription_status": {
          const status = licenseManager.getSubscriptionStatus();
          const usage = licenseManager.checkUsageLimit();

          return {
            content: [
              {
                type: "text",
                text: `${status.message}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📊 Today's Usage:\n${usage.message}`,
              },
            ],
          };
        }

        case "activate_subscription": {
          const { email } = args as {
            email: string;
          };

          const result = await licenseManager.activateSubscription(email);

          return {
            content: [
              {
                type: "text",
                text: result.message,
              },
            ],
          };
        }

        case "deactivate_subscription": {
          licenseManager.deactivateSubscription();

          return {
            content: [
              {
                type: "text",
                text: `✅ Subscription deactivated\n\nYou're now on the Free plan.\n\n🚀 Resubscribe anytime: ${licenseManager.purchaseUrl}`,
              },
            ],
          };
        }

        case "list_presets": {
          const availablePresets = licenseManager.getAvailablePresets();
          const status = licenseManager.getSubscriptionStatus();

          let presetList = "🎨 Available Presets:\n\n";

          for (const [id, info] of Object.entries(ALL_PRESETS)) {
            const isAvailable = availablePresets.includes(id);
            const icon = isAvailable ? "✅" : "🔒";
            const lockNote = isAvailable ? "" : " (Pro)";
            presetList += `${icon} ${id}: ${info.color1} → ${info.color2}${lockNote}\n`;
          }

          if (status.plan === "free") {
            presetList += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🚀 Unlock all presets with Pro ($4.9/mo)\n👉 ${licenseManager.purchaseUrl}`;
          }

          return {
            content: [
              {
                type: "text",
                text: presetList,
              },
            ],
          };
        }

        case "list_devices": {
          const availableDevices = licenseManager.getAvailableDevices();
          const status = licenseManager.getSubscriptionStatus();

          let deviceList = "📱 Available Devices:\n\n";

          for (const [id, info] of Object.entries(ALL_DEVICES)) {
            const isAvailable = availableDevices.includes(id);
            const icon = isAvailable ? "✅" : "🔒";
            const lockNote = isAvailable ? "" : " (Pro)";
            deviceList += `${icon} ${id}: ${info.description} (${info.width}x${info.height})${lockNote}\n`;
          }

          if (status.plan === "free") {
            deviceList += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🚀 Unlock all devices with Pro ($4.9/mo)\n👉 ${licenseManager.purchaseUrl}`;
          }

          return {
            content: [
              {
                type: "text",
                text: deviceList,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Store ScreenShot MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
