import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const outputDir = path.join(process.cwd(), "gumroad-assets");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Cover Image (1280x720)
async function createCoverImage() {
  const width = 1280;
  const height = 720;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea"/>
          <stop offset="100%" style="stop-color:#764ba2"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="20" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>

      <!-- Decorative circles -->
      <circle cx="100" cy="100" r="150" fill="rgba(255,255,255,0.05)"/>
      <circle cx="1200" cy="600" r="200" fill="rgba(255,255,255,0.05)"/>

      <!-- iPhone Mockup -->
      <g transform="translate(800, 80)" filter="url(#shadow)">
        <rect x="0" y="0" width="200" height="430" rx="30" fill="#1c1c1e"/>
        <rect x="8" y="8" width="184" height="414" rx="24" fill="#000"/>
        <rect x="60" y="18" width="80" height="24" rx="12" fill="#000"/>
        <rect x="60" y="400" width="80" height="6" rx="3" fill="rgba(255,255,255,0.5)"/>

        <!-- Screen content mockup -->
        <rect x="20" y="50" width="160" height="340" rx="8" fill="#1a1a2e"/>
        <rect x="30" y="70" width="100" height="12" rx="2" fill="#667eea"/>
        <rect x="30" y="90" width="140" height="8" rx="2" fill="rgba(255,255,255,0.3)"/>
        <rect x="30" y="110" width="120" height="8" rx="2" fill="rgba(255,255,255,0.2)"/>
        <rect x="30" y="140" width="140" height="80" rx="8" fill="rgba(102,126,234,0.3)"/>
        <rect x="30" y="240" width="140" height="60" rx="8" fill="rgba(118,75,162,0.3)"/>
        <rect x="30" y="320" width="80" height="30" rx="15" fill="#667eea"/>
      </g>

      <!-- Second iPhone (tilted) -->
      <g transform="translate(920, 150) rotate(15)" filter="url(#shadow)">
        <rect x="0" y="0" width="180" height="390" rx="28" fill="#1c1c1e"/>
        <rect x="7" y="7" width="166" height="376" rx="22" fill="#000"/>
        <rect x="50" y="16" width="70" height="22" rx="11" fill="#000"/>

        <!-- Screen content -->
        <rect x="18" y="45" width="144" height="310" rx="6" fill="#16213e"/>
        <rect x="28" y="65" width="90" height="10" rx="2" fill="#f093fb"/>
        <rect x="28" y="85" width="124" height="6" rx="2" fill="rgba(255,255,255,0.3)"/>
        <rect x="28" y="110" width="124" height="70" rx="6" fill="rgba(240,147,251,0.3)"/>
        <rect x="28" y="200" width="124" height="50" rx="6" fill="rgba(245,87,108,0.3)"/>
      </g>

      <!-- Text Content -->
      <text x="80" y="200" font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif" font-size="52" font-weight="800" fill="white">
        Store
      </text>
      <text x="80" y="270" font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif" font-size="52" font-weight="800" fill="white">
        Screenshot
      </text>
      <text x="80" y="340" font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif" font-size="52" font-weight="800" fill="white">
        Generator
      </text>

      <text x="80" y="400" font-family="SF Pro Display, Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="500" fill="rgba(255,255,255,0.8)">
        MCP Server for Claude
      </text>

      <!-- Feature badges -->
      <g transform="translate(80, 450)">
        <rect x="0" y="0" width="140" height="36" rx="18" fill="rgba(255,255,255,0.15)"/>
        <text x="70" y="24" text-anchor="middle" font-family="SF Pro Display, Arial" font-size="14" font-weight="600" fill="white">iPhone Mockups</text>
      </g>
      <g transform="translate(240, 450)">
        <rect x="0" y="0" width="120" height="36" rx="18" fill="rgba(255,255,255,0.15)"/>
        <text x="60" y="24" text-anchor="middle" font-family="SF Pro Display, Arial" font-size="14" font-weight="600" fill="white">7 Presets</text>
      </g>
      <g transform="translate(380, 450)">
        <rect x="0" y="0" width="100" height="36" rx="18" fill="rgba(255,255,255,0.15)"/>
        <text x="50" y="24" text-anchor="middle" font-family="SF Pro Display, Arial" font-size="14" font-weight="600" fill="white">Batch</text>
      </g>

    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, "cover-1280x720.png"));

  console.log("Created: cover-1280x720.png");
}

// Thumbnail (600x600)
async function createThumbnail() {
  const size = 600;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea"/>
          <stop offset="100%" style="stop-color:#764ba2"/>
        </linearGradient>
        <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="15" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${size}" height="${size}" fill="url(#bg2)"/>

      <!-- Decorative -->
      <circle cx="50" cy="50" r="100" fill="rgba(255,255,255,0.05)"/>
      <circle cx="550" cy="550" r="120" fill="rgba(255,255,255,0.05)"/>

      <!-- iPhone Mockup centered -->
      <g transform="translate(175, 80)" filter="url(#shadow2)">
        <rect x="0" y="0" width="250" height="540" rx="38" fill="#1c1c1e"/>
        <rect x="10" y="10" width="230" height="520" rx="30" fill="#000"/>
        <rect x="75" y="22" width="100" height="30" rx="15" fill="#000"/>
        <rect x="75" y="500" width="100" height="8" rx="4" fill="rgba(255,255,255,0.5)"/>

        <!-- Screen content -->
        <rect x="25" y="60" width="200" height="420" rx="10" fill="#1a1a2e"/>

        <!-- Mock UI elements -->
        <rect x="40" y="90" width="120" height="16" rx="3" fill="#667eea"/>
        <rect x="40" y="120" width="170" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
        <rect x="40" y="140" width="140" height="10" rx="2" fill="rgba(255,255,255,0.2)"/>

        <rect x="40" y="170" width="170" height="100" rx="10" fill="rgba(102,126,234,0.3)"/>
        <rect x="40" y="290" width="170" height="80" rx="10" fill="rgba(118,75,162,0.3)"/>

        <rect x="40" y="400" width="100" height="40" rx="20" fill="#667eea"/>
        <text x="90" y="427" text-anchor="middle" font-family="Arial" font-size="14" font-weight="600" fill="white">Generate</text>
      </g>

      <!-- App icon style badge -->
      <g transform="translate(420, 420)">
        <rect x="0" y="0" width="140" height="140" rx="32" fill="white" filter="url(#shadow2)"/>
        <rect x="10" y="10" width="120" height="120" rx="26" fill="url(#bg2)"/>
        <!-- Camera/Screenshot icon -->
        <rect x="35" y="45" width="70" height="50" rx="8" fill="none" stroke="white" stroke-width="4"/>
        <circle cx="70" cy="70" r="15" fill="none" stroke="white" stroke-width="4"/>
        <rect x="50" y="38" width="20" height="10" rx="2" fill="white"/>
        <text x="70" y="115" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="rgba(255,255,255,0.9)">for Claude</text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, "thumbnail-600x600.png"));

  console.log("Created: thumbnail-600x600.png");
}

// Product icon (400x400)
async function createProductIcon() {
  const size = 400;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea"/>
          <stop offset="100%" style="stop-color:#764ba2"/>
        </linearGradient>
      </defs>

      <!-- Background with rounded corners -->
      <rect width="${size}" height="${size}" rx="80" fill="url(#bg3)"/>

      <!-- iPhone outline -->
      <g transform="translate(120, 50)">
        <rect x="0" y="0" width="160" height="300" rx="24" fill="none" stroke="white" stroke-width="8"/>
        <rect x="45" y="14" width="70" height="20" rx="10" fill="white"/>
        <rect x="45" y="270" width="70" height="6" rx="3" fill="white"/>

        <!-- Screen lines -->
        <rect x="20" y="50" width="80" height="8" rx="2" fill="rgba(255,255,255,0.8)"/>
        <rect x="20" y="70" width="120" height="6" rx="2" fill="rgba(255,255,255,0.5)"/>
        <rect x="20" y="90" width="100" height="6" rx="2" fill="rgba(255,255,255,0.3)"/>

        <!-- Content blocks -->
        <rect x="20" y="120" width="120" height="60" rx="8" fill="rgba(255,255,255,0.3)"/>
        <rect x="20" y="200" width="120" height="40" rx="8" fill="rgba(255,255,255,0.2)"/>
      </g>

      <!-- Sparkle/magic effect -->
      <g fill="white">
        <circle cx="320" cy="80" r="8"/>
        <circle cx="340" cy="120" r="5"/>
        <circle cx="80" cy="320" r="6"/>
        <circle cx="60" cy="280" r="4"/>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, "icon-400x400.png"));

  console.log("Created: icon-400x400.png");
}

async function main() {
  console.log("Creating Gumroad assets...\n");

  await createCoverImage();
  await createThumbnail();
  await createProductIcon();

  console.log(`\nAll assets saved to: ${outputDir}`);
}

main().catch(console.error);
