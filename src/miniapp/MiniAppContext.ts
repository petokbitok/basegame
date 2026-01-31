/**
 * App context information
 */
export interface AppContext {
  clientFid: number | null;
  platform: 'base-app' | 'web';
  version: string;
}

/**
 * Mini App context for Base App integration
 * Detects environment and provides conditional authentication
 */
export class MiniAppContext {
  private context: AppContext;

  constructor() {
    this.context = this.detectEnvironment();
  }

  /**
   * Detect if running in Base App or web browser
   * @returns AppContext Environment context
   */
  private detectEnvironment(): AppContext {
    // Check for Base App specific properties
    const isBaseApp = this.isBaseApp();

    return {
      clientFid: this.getClientFid(),
      platform: isBaseApp ? 'base-app' : 'web',
      version: '1.0.0',
    };
  }

  /**
   * Check if running inside Base App
   * @returns boolean True if in Base App
   */
  isBaseApp(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for Base App specific markers
    return !!(
      (window as any).base ||
      (window as any).baseApp ||
      navigator.userAgent.includes('BaseApp')
    );
  }

  /**
   * Get client FID if available
   * @returns number | null Client FID or null
   */
  getClientFid(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const baseContext = (window as any).base?.context;
    return baseContext?.fid || null;
  }

  /**
   * Check if should use native Base App auth
   * @returns boolean True if should use native auth
   */
  useNativeAuth(): boolean {
    return this.isBaseApp() && this.getClientFid() !== null;
  }

  /**
   * Get app context
   * @returns AppContext Current context
   */
  getAppContext(): AppContext {
    return { ...this.context };
  }

  /**
   * Get platform name
   * @returns string Platform name
   */
  getPlatform(): 'base-app' | 'web' {
    return this.context.platform;
  }
}
