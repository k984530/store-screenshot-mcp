import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface SubscriptionInfo {
  key: string;
  email?: string;
  activatedAt: string;
  expiresAt: string;
  plan: "free" | "pro";
  status: "active" | "expired" | "cancelled";
}

interface LicenseValidation {
  valid: boolean;
  plan: "free" | "pro";
  status: "active" | "expired" | "cancelled" | "none";
  expiresAt?: string;
  daysRemaining?: number;
  features: string[];
  message: string;
}

// Feature flags by plan
const PLAN_FEATURES = {
  free: {
    maxScreenshotsPerDay: 3,
    devices: ["iphone-15-pro-max"],
    presets: ["purple", "dark"],
    batchGeneration: false,
    customColors: false,
    watermark: true,
    highResolution: false,
  },
  pro: {
    maxScreenshotsPerDay: Infinity,
    devices: ["iphone-15-pro-max", "iphone-15-pro", "iphone-se", "ipad-pro"],
    presets: ["purple", "pink", "blue", "green", "orange", "dark", "light"],
    batchGeneration: true,
    customColors: true,
    watermark: false,
    highResolution: true,
  },
};

// Pricing
const PRICING = {
  monthly: {
    price: 4.9,
    currency: "USD",
    interval: "month",
  },
};

export class LicenseManager {
  private configDir: string;
  private licenseFile: string;
  private usageFile: string;
  private currentSubscription: SubscriptionInfo | null = null;

  // 결제 URL (Gumroad/LemonSqueezy/Stripe 링크로 변경)
  public readonly purchaseUrl = "https://8566730725923.gumroad.com/l/bkkfx";
  public readonly manageUrl = "https://app.gumroad.com/library";
  public readonly productName = "Store Screenshot Generator Pro";
  public readonly pricing = PRICING;

  constructor() {
    this.configDir = path.join(os.homedir(), ".store-screenshot-mcp");
    this.licenseFile = path.join(this.configDir, "subscription.json");
    this.usageFile = path.join(this.configDir, "usage.json");
    this.ensureConfigDir();
    this.loadSubscription();
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  private loadSubscription(): void {
    try {
      if (fs.existsSync(this.licenseFile)) {
        const data = fs.readFileSync(this.licenseFile, "utf-8");
        this.currentSubscription = JSON.parse(data);
      }
    } catch (error) {
      this.currentSubscription = null;
    }
  }

  private saveSubscription(subscription: SubscriptionInfo): void {
    fs.writeFileSync(this.licenseFile, JSON.stringify(subscription, null, 2));
    this.currentSubscription = subscription;
  }

  /**
   * Validate license key format
   * Format: XXXX-XXXX-XXXX-XXXX
   */
  private validateKeyFormat(key: string): boolean {
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key.toUpperCase());
  }

  /**
   * Verify subscription key with server (simulated)
   * In production: API call to LemonSqueezy/Gumroad/your server
   */
  private async verifySubscription(key: string): Promise<{
    valid: boolean;
    expiresAt: string;
    status: "active" | "expired" | "cancelled";
  } | null> {
    const normalizedKey = key.toUpperCase().trim();

    if (!this.validateKeyFormat(normalizedKey)) {
      return null;
    }

    // ============================================
    // TODO: Replace with actual API verification
    // ============================================
    // Example with LemonSqueezy API:
    // const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ license_key: key })
    // });
    // const data = await response.json();
    // return { valid: data.valid, expiresAt: data.license_key.expires_at, status: data.status };

    // Demo: Calculate expiry (1 month from now for demo keys)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    return {
      valid: true,
      expiresAt: expiresAt.toISOString(),
      status: "active",
    };
  }

  /**
   * Check if subscription is expired
   */
  private isExpired(): boolean {
    if (!this.currentSubscription) return true;
    const expiresAt = new Date(this.currentSubscription.expiresAt);
    return expiresAt < new Date();
  }

  /**
   * Get days remaining in subscription
   */
  private getDaysRemaining(): number {
    if (!this.currentSubscription) return 0;
    const expiresAt = new Date(this.currentSubscription.expiresAt);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Activate subscription with license key
   */
  async activateSubscription(key: string, email?: string): Promise<LicenseValidation> {
    const verification = await this.verifySubscription(key);

    if (!verification || !verification.valid) {
      return {
        valid: false,
        plan: "free",
        status: "none",
        features: Object.keys(PLAN_FEATURES.free),
        message: `❌ Invalid license key\n\nPlease check your key and try again.\n\n📦 Subscribe at: ${this.purchaseUrl}\n💰 Only $${PRICING.monthly.price}/month`,
      };
    }

    const subscription: SubscriptionInfo = {
      key: key.toUpperCase().trim(),
      email,
      activatedAt: new Date().toISOString(),
      expiresAt: verification.expiresAt,
      plan: "pro",
      status: verification.status,
    };

    this.saveSubscription(subscription);

    const daysRemaining = this.getDaysRemaining();

    return {
      valid: true,
      plan: "pro",
      status: "active",
      expiresAt: verification.expiresAt,
      daysRemaining,
      features: Object.keys(PLAN_FEATURES.pro),
      message: `✅ Subscription Activated!\n\n🎉 Plan: PRO ($${PRICING.monthly.price}/month)\n📅 Expires: ${new Date(verification.expiresAt).toLocaleDateString()}\n⏳ Days remaining: ${daysRemaining}\n\nFeatures unlocked:\n• Unlimited screenshots\n• No watermark\n• All devices & presets\n• Batch generation\n• Custom colors\n\nThank you for subscribing! 🙏`,
    };
  }

  /**
   * Refresh subscription status (check with server)
   */
  async refreshSubscription(): Promise<LicenseValidation> {
    if (!this.currentSubscription) {
      return this.getSubscriptionStatus();
    }

    const verification = await this.verifySubscription(this.currentSubscription.key);

    if (!verification || !verification.valid) {
      // Subscription invalid or cancelled
      this.currentSubscription.status = "cancelled";
      this.saveSubscription(this.currentSubscription);

      return {
        valid: false,
        plan: "free",
        status: "cancelled",
        features: Object.keys(PLAN_FEATURES.free),
        message: `⚠️ Subscription Cancelled\n\nYour subscription is no longer active.\n\n🔄 Resubscribe: ${this.purchaseUrl}`,
      };
    }

    // Update expiry
    this.currentSubscription.expiresAt = verification.expiresAt;
    this.currentSubscription.status = verification.status;
    this.saveSubscription(this.currentSubscription);

    return this.getSubscriptionStatus();
  }

  /**
   * Deactivate subscription
   */
  deactivateSubscription(): void {
    if (fs.existsSync(this.licenseFile)) {
      fs.unlinkSync(this.licenseFile);
    }
    this.currentSubscription = null;
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): LicenseValidation {
    if (!this.currentSubscription) {
      return {
        valid: false,
        plan: "free",
        status: "none",
        features: Object.keys(PLAN_FEATURES.free),
        message: this.getFreeplanMessage(),
      };
    }

    // Check if expired
    if (this.isExpired()) {
      return {
        valid: false,
        plan: "free",
        status: "expired",
        expiresAt: this.currentSubscription.expiresAt,
        daysRemaining: 0,
        features: Object.keys(PLAN_FEATURES.free),
        message: `⚠️ Subscription Expired\n\nYour Pro subscription expired on ${new Date(this.currentSubscription.expiresAt).toLocaleDateString()}\n\n🔄 Renew now: ${this.purchaseUrl}\n💰 Only $${PRICING.monthly.price}/month\n\nYou're now on the Free plan with limitations.`,
      };
    }

    const daysRemaining = this.getDaysRemaining();

    // Warning if expiring soon
    let warningMessage = "";
    if (daysRemaining <= 7) {
      warningMessage = `\n\n⚠️ Expiring in ${daysRemaining} days!\n🔄 Renew: ${this.manageUrl}`;
    }

    return {
      valid: true,
      plan: "pro",
      status: "active",
      expiresAt: this.currentSubscription.expiresAt,
      daysRemaining,
      features: Object.keys(PLAN_FEATURES.pro),
      message: `✅ PRO Subscription Active\n\n🔑 Key: ${this.maskKey(this.currentSubscription.key)}\n📅 Expires: ${new Date(this.currentSubscription.expiresAt).toLocaleDateString()}\n⏳ Days remaining: ${daysRemaining}\n\n📊 Manage subscription: ${this.manageUrl}${warningMessage}`,
    };
  }

  private getFreeplanMessage(): string {
    return `📦 FREE Plan

Limitations:
• ${PLAN_FEATURES.free.maxScreenshotsPerDay} screenshots/day
• Watermark on all images
• Limited presets (${PLAN_FEATURES.free.presets.join(", ")})
• iPhone 15 Pro Max only
• No batch generation
• No custom colors

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Upgrade to PRO - $${PRICING.monthly.price}/month

✓ Unlimited screenshots
✓ No watermark
✓ All 7 color presets
✓ All device mockups
✓ Batch generation
✓ Custom gradient colors
✓ Priority support

👉 Subscribe: ${this.purchaseUrl}`;
  }

  private maskKey(key: string): string {
    return key.substring(0, 4) + "-****-****-" + key.substring(15);
  }

  /**
   * Check if a feature is available
   */
  hasFeature(feature: keyof typeof PLAN_FEATURES.pro): boolean {
    if (!this.currentSubscription || this.isExpired()) {
      return !!PLAN_FEATURES.free[feature as keyof typeof PLAN_FEATURES.free];
    }
    return !!PLAN_FEATURES.pro[feature];
  }

  /**
   * Get plan features
   */
  getPlanFeatures(): typeof PLAN_FEATURES.free | typeof PLAN_FEATURES.pro {
    if (!this.currentSubscription || this.isExpired()) {
      return PLAN_FEATURES.free;
    }
    return PLAN_FEATURES.pro;
  }

  /**
   * Check daily usage limit
   */
  checkUsageLimit(): { allowed: boolean; used: number; limit: number; message: string } {
    const features = this.getPlanFeatures();
    const limit = features.maxScreenshotsPerDay;

    if (limit === Infinity) {
      return { allowed: true, used: 0, limit: Infinity, message: "✅ Unlimited usage (Pro)" };
    }

    const today = new Date().toISOString().split("T")[0];
    let usage = { date: today, count: 0 };

    try {
      if (fs.existsSync(this.usageFile)) {
        const data = JSON.parse(fs.readFileSync(this.usageFile, "utf-8"));
        if (data.date === today) {
          usage = data;
        }
      }
    } catch (error) {
      // Reset on error
    }

    if (usage.count >= limit) {
      return {
        allowed: false,
        used: usage.count,
        limit,
        message: `⚠️ Daily limit reached (${usage.count}/${limit})\n\n🚀 Upgrade to Pro for unlimited:\n${this.purchaseUrl}\n\n💰 Only $${PRICING.monthly.price}/month`,
      };
    }

    const remaining = limit - usage.count;
    return {
      allowed: true,
      used: usage.count,
      limit,
      message: `📊 Usage: ${usage.count}/${limit} today (${remaining} remaining)`,
    };
  }

  /**
   * Increment usage counter
   */
  incrementUsage(): void {
    const features = this.getPlanFeatures();
    if (features.maxScreenshotsPerDay === Infinity) return;

    const today = new Date().toISOString().split("T")[0];
    let usage = { date: today, count: 0 };

    try {
      if (fs.existsSync(this.usageFile)) {
        const data = JSON.parse(fs.readFileSync(this.usageFile, "utf-8"));
        if (data.date === today) {
          usage = data;
        }
      }
    } catch (error) {
      // Reset on error
    }

    usage.count++;
    fs.writeFileSync(this.usageFile, JSON.stringify(usage, null, 2));
  }

  /**
   * Get available presets based on plan
   */
  getAvailablePresets(): string[] {
    return this.getPlanFeatures().presets as string[];
  }

  /**
   * Get available devices based on plan
   */
  getAvailableDevices(): string[] {
    return this.getPlanFeatures().devices as string[];
  }

  /**
   * Check if watermark should be added
   */
  shouldAddWatermark(): boolean {
    return this.getPlanFeatures().watermark;
  }

  /**
   * Check if custom colors are allowed
   */
  canUseCustomColors(): boolean {
    return this.getPlanFeatures().customColors;
  }

  /**
   * Check if batch generation is allowed
   */
  canUseBatchGeneration(): boolean {
    return this.getPlanFeatures().batchGeneration;
  }

  /**
   * Generate demo license key (for testing)
   */
  static generateDemoKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments: string[] = [];

    for (let i = 0; i < 4; i++) {
      let segment = "";
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }

    return segments.join("-");
  }
}
