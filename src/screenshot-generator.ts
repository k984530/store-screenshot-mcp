import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { LicenseManager } from "./license-manager.js";

interface DeviceConfig {
  width: number;
  height: number;
  name: string;
}

interface GenerateOptions {
  headline?: string;
  subheadline?: string;
  screenshotPath?: string;
  screenshotBase64?: string;
  outputPath?: string;
  device?: string;
  bgColor1?: string;
  bgColor2?: string;
  preset?: string;
}

interface GenerateResult {
  base64?: string;
  outputPath?: string;
  width: number;
  height: number;
  watermarked: boolean;
  usageInfo?: string;
}

interface BatchOptions {
  slides: Array<{
    headline?: string;
    subheadline?: string;
    screenshotPath?: string;
    screenshotBase64?: string;
  }>;
  outputDirectory: string;
  device?: string;
  bgColor1?: string;
  bgColor2?: string;
  preset?: string;
}

// Color presets
const COLOR_PRESETS: Record<string, { color1: string; color2: string }> = {
  purple: { color1: "#667eea", color2: "#764ba2" },
  pink: { color1: "#f093fb", color2: "#f5576c" },
  blue: { color1: "#4facfe", color2: "#00f2fe" },
  green: { color1: "#43e97b", color2: "#38f9d7" },
  orange: { color1: "#fa709a", color2: "#fee140" },
  dark: { color1: "#232526", color2: "#414345" },
  light: { color1: "#e0e5ec", color2: "#f5f7fa" },
};

export class ScreenshotGenerator {
  private deviceConfigs: Record<string, DeviceConfig> = {
    // iPhones
    "iphone-15-pro-max": { width: 1290, height: 2796, name: "iPhone 15 Pro Max" },
    "iphone-15-pro": { width: 1179, height: 2556, name: "iPhone 15 Pro" },
    "iphone-se": { width: 750, height: 1334, name: "iPhone SE" },
    // iPads
    "ipad-pro-129": { width: 2048, height: 2732, name: "iPad Pro 12.9\"" },
    "ipad-pro-11": { width: 1668, height: 2388, name: "iPad Pro 11\"" },
    "ipad-air": { width: 1640, height: 2360, name: "iPad Air" },
    "ipad-mini": { width: 1488, height: 2266, name: "iPad Mini" },
  };

  private licenseManager: LicenseManager;

  constructor() {
    this.licenseManager = new LicenseManager();
  }

  getLicenseManager(): LicenseManager {
    return this.licenseManager;
  }

  private isIPad(device: string): boolean {
    return device.startsWith("ipad-");
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    // Check usage limit
    const usageCheck = this.licenseManager.checkUsageLimit();
    if (!usageCheck.allowed) {
      throw new Error(usageCheck.message);
    }

    // Check device availability
    const device = options.device || "iphone-15-pro-max";
    const availableDevices = this.licenseManager.getAvailableDevices();
    if (!availableDevices.includes(device)) {
      throw new Error(
        `Device "${device}" is not available in your plan.\n\nAvailable devices: ${availableDevices.join(", ")}\n\n🚀 Upgrade to Pro for all devices: ${this.licenseManager.purchaseUrl}`
      );
    }

    const config = this.deviceConfigs[device];
    if (!config) {
      throw new Error(`Unknown device: ${device}`);
    }

    // Check preset availability
    let bgColor1 = options.bgColor1;
    let bgColor2 = options.bgColor2;

    if (options.preset) {
      const availablePresets = this.licenseManager.getAvailablePresets();
      if (!availablePresets.includes(options.preset)) {
        throw new Error(
          `Preset "${options.preset}" is not available in your plan.\n\nAvailable presets: ${availablePresets.join(", ")}\n\n🚀 Upgrade to Pro for all presets: ${this.licenseManager.purchaseUrl}`
        );
      }
      const preset = COLOR_PRESETS[options.preset];
      if (preset) {
        bgColor1 = preset.color1;
        bgColor2 = preset.color2;
      }
    }

    // Check custom colors
    if ((options.bgColor1 || options.bgColor2) && !options.preset) {
      if (!this.licenseManager.canUseCustomColors()) {
        throw new Error(
          `Custom colors are not available in the Free plan.\n\nUse a preset instead: ${this.licenseManager.getAvailablePresets().join(", ")}\n\n🚀 Upgrade to Pro for custom colors: ${this.licenseManager.purchaseUrl}`
        );
      }
    }

    bgColor1 = bgColor1 || "#667eea";
    bgColor2 = bgColor2 || "#764ba2";

    const shouldWatermark = this.licenseManager.shouldAddWatermark();

    // Create SVG with background and mockup
    const isTablet = this.isIPad(device);
    const svg = this.createSVG(
      config.width,
      config.height,
      bgColor1,
      bgColor2,
      options.headline || "",
      options.subheadline || "",
      shouldWatermark,
      isTablet
    );

    // Start with background SVG
    let composite = sharp(Buffer.from(svg));

    // If screenshot is provided, add it to the mockup
    if (options.screenshotPath || options.screenshotBase64) {
      let screenshotBuffer: Buffer;

      if (options.screenshotPath) {
        screenshotBuffer = fs.readFileSync(options.screenshotPath);
      } else {
        screenshotBuffer = Buffer.from(options.screenshotBase64!, "base64");
      }

      // Calculate mockup dimensions (different for iPad vs iPhone)
      let mockupWidth: number;
      let mockupHeight: number;
      let mockupY: number;
      let frameThickness: number;
      let screenRadius: number;

      if (isTablet) {
        // iPad: wider aspect ratio, larger screen
        mockupWidth = Math.floor(config.width * 0.85);
        mockupHeight = Math.floor(mockupWidth * (config.height / config.width));
        mockupY = Math.floor(config.height * 0.18);
        frameThickness = Math.floor(mockupWidth * 0.015);
        screenRadius = Math.floor(mockupWidth * 0.025);
      } else {
        // iPhone
        mockupWidth = Math.floor(config.width * 0.75);
        mockupHeight = Math.floor(mockupWidth * 2.16);
        mockupY = Math.floor(config.height * 0.24);
        frameThickness = Math.floor(mockupWidth * 0.025);
        screenRadius = Math.floor(mockupWidth * 0.1);
      }

      const mockupX = Math.floor((config.width - mockupWidth) / 2);

      const screenWidth = mockupWidth - frameThickness * 2;
      const screenHeight = mockupHeight - frameThickness * 2;
      const screenX = mockupX + frameThickness;
      const screenY = mockupY + frameThickness;

      // Resize screenshot to fit screen
      const resizedScreenshot = await sharp(screenshotBuffer)
        .resize(screenWidth, screenHeight, {
          fit: "cover",
          position: "top",
        })
        .png()
        .toBuffer();

      // Create rounded mask for screenshot
      const maskSvg = `
        <svg width="${screenWidth}" height="${screenHeight}">
          <rect x="0" y="0" width="${screenWidth}" height="${screenHeight}" rx="${screenRadius}" ry="${screenRadius}" fill="white"/>
        </svg>
      `;

      const maskedScreenshot = await sharp(resizedScreenshot)
        .composite([
          {
            input: Buffer.from(maskSvg),
            blend: "dest-in",
          },
        ])
        .png()
        .toBuffer();

      // Composite everything together
      const result = await composite
        .composite([
          {
            input: maskedScreenshot,
            top: screenY,
            left: screenX,
          },
        ])
        .png()
        .toBuffer();

      composite = sharp(result);
    }

    // Increment usage counter
    this.licenseManager.incrementUsage();

    // Save or return base64
    if (options.outputPath) {
      const dir = path.dirname(options.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await composite.toFile(options.outputPath);
      return {
        outputPath: options.outputPath,
        width: config.width,
        height: config.height,
        watermarked: shouldWatermark,
        usageInfo: usageCheck.message,
      };
    } else {
      const buffer = await composite.png().toBuffer();
      const base64 = buffer.toString("base64");
      return {
        base64,
        width: config.width,
        height: config.height,
        watermarked: shouldWatermark,
        usageInfo: usageCheck.message,
      };
    }
  }

  async generateBatch(options: BatchOptions): Promise<GenerateResult[]> {
    // Check batch generation permission
    if (!this.licenseManager.canUseBatchGeneration()) {
      throw new Error(
        `Batch generation is not available in the Free plan.\n\n🚀 Upgrade to Pro for batch generation: ${this.licenseManager.purchaseUrl}`
      );
    }

    const results: GenerateResult[] = [];

    if (!fs.existsSync(options.outputDirectory)) {
      fs.mkdirSync(options.outputDirectory, { recursive: true });
    }

    for (let i = 0; i < options.slides.length; i++) {
      const slide = options.slides[i];
      const outputPath = path.join(
        options.outputDirectory,
        `screenshot_${String(i + 1).padStart(2, "0")}.png`
      );

      const result = await this.generate({
        headline: slide.headline,
        subheadline: slide.subheadline,
        screenshotPath: slide.screenshotPath,
        screenshotBase64: slide.screenshotBase64,
        outputPath,
        device: options.device,
        bgColor1: options.bgColor1,
        bgColor2: options.bgColor2,
        preset: options.preset,
      });

      results.push(result);
    }

    return results;
  }

  private createSVG(
    width: number,
    height: number,
    color1: string,
    color2: string,
    headline: string,
    subheadline: string,
    addWatermark: boolean,
    isTablet: boolean = false
  ): string {
    // Mockup dimensions (different for iPad vs iPhone)
    let mockupWidth: number;
    let mockupHeight: number;
    let mockupY: number;
    let frameRadius: number;
    let frameThickness: number;
    let screenRadius: number;

    if (isTablet) {
      // iPad mockup dimensions
      mockupWidth = Math.floor(width * 0.85);
      mockupHeight = Math.floor(mockupWidth * (height / width));
      mockupY = Math.floor(height * 0.18);
      frameRadius = Math.floor(mockupWidth * 0.03);
      frameThickness = Math.floor(mockupWidth * 0.015);
      screenRadius = Math.floor(mockupWidth * 0.025);
    } else {
      // iPhone mockup dimensions
      mockupWidth = Math.floor(width * 0.75);
      mockupHeight = Math.floor(mockupWidth * 2.16);
      mockupY = Math.floor(height * 0.24);
      frameRadius = Math.floor(mockupWidth * 0.12);
      frameThickness = Math.floor(mockupWidth * 0.025);
      screenRadius = Math.floor(mockupWidth * 0.1);
    }

    const mockupX = Math.floor((width - mockupWidth) / 2);
    const screenX = mockupX + frameThickness;
    const screenY = mockupY + frameThickness;
    const screenWidth = mockupWidth - frameThickness * 2;
    const screenHeight = mockupHeight - frameThickness * 2;

    // Dynamic Island (iPhone only)
    const islandWidth = Math.floor(mockupWidth * 0.35);
    const islandHeight = Math.floor(mockupWidth * 0.085);
    const islandX = mockupX + Math.floor((mockupWidth - islandWidth) / 2);
    const islandY = mockupY + frameThickness + Math.floor(mockupWidth * 0.03);

    // Home indicator
    const indicatorWidth = isTablet ? Math.floor(mockupWidth * 0.15) : Math.floor(mockupWidth * 0.35);
    const indicatorHeight = isTablet ? Math.floor(mockupWidth * 0.005) : Math.floor(mockupWidth * 0.015);
    const indicatorX = mockupX + Math.floor((mockupWidth - indicatorWidth) / 2);
    const indicatorY = mockupY + mockupHeight - frameThickness - (isTablet ? Math.floor(mockupWidth * 0.02) : Math.floor(mockupWidth * 0.05));

    // Side buttons (iPhone only)
    const buttonWidth = Math.floor(mockupWidth * 0.008);
    const volumeButtonHeight = Math.floor(mockupWidth * 0.08);
    const volumeY1 = mockupY + Math.floor(mockupHeight * 0.18);
    const volumeY2 = mockupY + Math.floor(mockupHeight * 0.26);
    const actionY = mockupY + Math.floor(mockupHeight * 0.12);
    const actionHeight = Math.floor(mockupWidth * 0.06);
    const powerY = mockupY + Math.floor(mockupHeight * 0.2);
    const powerHeight = Math.floor(mockupWidth * 0.12);

    // Font sizes
    const headlineSize = Math.floor(width * 0.075);
    const subheadlineSize = Math.floor(width * 0.06);
    const headlineY = Math.floor(height * 0.1);
    const subheadlineY = headlineY + Math.floor(headlineSize * 1.3);

    // Watermark
    const watermarkSize = Math.floor(width * 0.025);
    const watermarkY = height - Math.floor(height * 0.02);

    // Escape text for SVG
    const escapeXml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const watermarkElement = addWatermark
      ? `
        <!-- Watermark -->
        <text x="${width / 2}" y="${watermarkY}"
              text-anchor="middle"
              font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif"
              font-size="${watermarkSize}"
              font-weight="500"
              fill="rgba(255,255,255,0.6)">
          Made with AppStore Screenshot Generator - Upgrade to remove
        </text>
        <rect x="${width * 0.1}" y="${height * 0.85}"
              width="${width * 0.8}" height="${Math.floor(width * 0.08)}"
              rx="10" ry="10"
              fill="rgba(0,0,0,0.4)"/>
        <text x="${width / 2}" y="${height * 0.85 + Math.floor(width * 0.05)}"
              text-anchor="middle"
              font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif"
              font-size="${Math.floor(width * 0.028)}"
              font-weight="600"
              fill="white">
          FREE VERSION - $4.9/mo to remove watermark
        </text>
      `
      : "";

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
          <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1c1c1e" />
            <stop offset="30%" style="stop-color:#2c2c2e" />
            <stop offset="50%" style="stop-color:#3a3a3c" />
            <stop offset="70%" style="stop-color:#2c2c2e" />
            <stop offset="100%" style="stop-color:#1c1c1e" />
          </linearGradient>
          <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.1)" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="20" stdDeviation="30" flood-opacity="0.4"/>
          </filter>
          <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>

        <!-- Text -->
        <text x="${width / 2}" y="${headlineY}"
              text-anchor="middle"
              font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif"
              font-size="${headlineSize}"
              font-weight="700"
              fill="white"
              filter="url(#textShadow)">
          ${escapeXml(headline)}
        </text>
        <text x="${width / 2}" y="${subheadlineY}"
              text-anchor="middle"
              font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif"
              font-size="${subheadlineSize}"
              font-weight="600"
              fill="white"
              filter="url(#textShadow)">
          ${escapeXml(subheadline)}
        </text>

        <!-- Device Frame with Shadow -->
        <rect x="${mockupX}" y="${mockupY}"
              width="${mockupWidth}" height="${mockupHeight}"
              rx="${frameRadius}" ry="${frameRadius}"
              fill="url(#frameGradient)"
              filter="url(#shadow)"/>

        <!-- Screen Background -->
        <rect x="${screenX}" y="${screenY}"
              width="${screenWidth}" height="${screenHeight}"
              rx="${screenRadius}" ry="${screenRadius}"
              fill="#000"/>

        ${!isTablet ? `
        <!-- Dynamic Island (iPhone only) -->
        <rect x="${islandX}" y="${islandY}"
              width="${islandWidth}" height="${islandHeight}"
              rx="${islandHeight / 2}" ry="${islandHeight / 2}"
              fill="#000"/>
        ` : ''}

        <!-- Home Indicator -->
        <rect x="${indicatorX}" y="${indicatorY}"
              width="${indicatorWidth}" height="${indicatorHeight}"
              rx="${indicatorHeight / 2}" ry="${indicatorHeight / 2}"
              fill="rgba(255,255,255,0.5)"/>

        ${!isTablet ? `
        <!-- Side Buttons (iPhone only) -->
        <rect x="${mockupX - buttonWidth}" y="${volumeY1}"
              width="${buttonWidth}" height="${volumeButtonHeight}"
              rx="${buttonWidth / 2}" ry="${buttonWidth / 2}"
              fill="#3a3a3c"/>
        <rect x="${mockupX - buttonWidth}" y="${volumeY2}"
              width="${buttonWidth}" height="${volumeButtonHeight}"
              rx="${buttonWidth / 2}" ry="${buttonWidth / 2}"
              fill="#3a3a3c"/>
        <rect x="${mockupX - buttonWidth}" y="${actionY}"
              width="${buttonWidth}" height="${actionHeight}"
              rx="${buttonWidth / 2}" ry="${buttonWidth / 2}"
              fill="#3a3a3c"/>
        <rect x="${mockupX + mockupWidth}" y="${powerY}"
              width="${buttonWidth}" height="${powerHeight}"
              rx="${buttonWidth / 2}" ry="${buttonWidth / 2}"
              fill="#3a3a3c"/>
        ` : ''}

        <!-- Frame Highlight -->
        <rect x="${mockupX}" y="${mockupY}"
              width="${mockupWidth}" height="${mockupHeight * 0.3}"
              rx="${frameRadius}" ry="${frameRadius}"
              fill="url(#highlightGradient)"/>

        ${watermarkElement}
      </svg>
    `;
  }
}
