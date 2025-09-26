/**
 * Simple and Reliable Configuration Manager
 * Uses direct environment variable access with safe fallbacks
 */

interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  // OpenAI Configuration
  openaiApiKey?: string;
  enableAIAnalysis: boolean;
  // Security Configuration
  enableSecurityHeaders: boolean;
  enableRateLimit: boolean;
  rateLimitRequestsPerMinute: number;
  // Feature Flags
  enableDevTools: boolean;
  enablePWA: boolean;
  // URLs
  baseUrl: string;
  apiBaseUrl?: string;
  // Monitoring
  sentryDsn?: string;
  gaTrackingId?: string;
  // App Info
  appName: string;
}

// Fallback configuration that always works
const FALLBACK_CONFIG: AppConfig = {
  supabaseUrl: 'https://wlxmcgoxsepwbnfdgxvq.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s',
  environment: 'development',
  isDevelopment: true,
  isProduction: false,
  // OpenAI Configuration
  openaiApiKey: undefined,
  enableAIAnalysis: true,
  // Security Configuration
  enableSecurityHeaders: false,
  enableRateLimit: false,
  rateLimitRequestsPerMinute: 60,
  // Feature Flags
  enableDevTools: true,
  enablePWA: false,
  // URLs
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  apiBaseUrl: undefined,
  // Monitoring
  sentryDsn: undefined,
  gaTrackingId: undefined,
  // App Info
  appName: 'AB Property Inspection Services',
};

// Simple environment variable getter with safe access
const safeGetEnv = (key: string): string | undefined => {
  try {
    // Only try to access import.meta.env if it exists
    if (typeof import.meta !== 'undefined' && 
        import.meta && 
        import.meta.env &&
        typeof import.meta.env === 'object') {
      return import.meta.env[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

// Create configuration - this runs immediately but safely
const createConfig = (): AppConfig => {
  try {
    // Core Supabase variables
    const supabaseUrl = safeGetEnv('VITE_SUPABASE_URL');
    const supabaseAnonKey = safeGetEnv('VITE_SUPABASE_ANON_KEY');
    const environment = safeGetEnv('VITE_APP_ENV') || 'development';
    
    // OpenAI configuration
    const openaiApiKey = safeGetEnv('VITE_OPENAI_API_KEY');
    const enableAIAnalysis = safeGetEnv('VITE_ENABLE_AI_ANALYSIS') !== 'false';
    
    // Security configuration
    const enableSecurityHeaders = safeGetEnv('VITE_ENABLE_SECURITY_HEADERS') === 'true';
    const enableRateLimit = safeGetEnv('VITE_RATE_LIMIT_ENABLED') === 'true';
    const rateLimitRequestsPerMinute = parseInt(safeGetEnv('VITE_RATE_LIMIT_REQUESTS_PER_MINUTE') || '60', 10);
    
    // Feature flags
    const enableDevTools = safeGetEnv('VITE_ENABLE_DEV_TOOLS') !== 'false' && environment === 'development';
    const enablePWA = safeGetEnv('VITE_ENABLE_PWA') === 'true';
    
    // URLs
    const baseUrl = safeGetEnv('VITE_BASE_URL') || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
    const apiBaseUrl = safeGetEnv('VITE_API_BASE_URL');
    
    // Monitoring
    const sentryDsn = safeGetEnv('VITE_SENTRY_DSN');
    const gaTrackingId = safeGetEnv('VITE_GA_TRACKING_ID');
    
    // App info
    const appName = safeGetEnv('VITE_APP_NAME') || 'AB Property Inspection Services';
    
    // Create configuration object
    const config: AppConfig = {
      supabaseUrl: supabaseUrl || FALLBACK_CONFIG.supabaseUrl,
      supabaseAnonKey: supabaseAnonKey || FALLBACK_CONFIG.supabaseAnonKey,
      environment,
      isDevelopment: environment === 'development',
      isProduction: environment === 'production',
      // OpenAI Configuration
      openaiApiKey,
      enableAIAnalysis,
      // Security Configuration
      enableSecurityHeaders,
      enableRateLimit,
      rateLimitRequestsPerMinute,
      // Feature Flags
      enableDevTools,
      enablePWA,
      // URLs
      baseUrl,
      apiBaseUrl,
      // Monitoring
      sentryDsn,
      gaTrackingId,
      // App Info
      appName,
    };
    
    // Log configuration status
    if (supabaseUrl && supabaseAnonKey) {
      console.log('✅ Environment variables loaded successfully from import.meta.env');
      if (environment === 'production') {
        console.log('🚀 Production mode enabled');
      }
    } else {
      console.log('⚠️ Core environment variables not available, using fallback configuration');
      if (typeof import.meta !== 'undefined' && import.meta?.env && typeof import.meta.env === 'object') {
        try {
          const availableKeys = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
          console.log('📝 Available VITE_ vars:', availableKeys);
        } catch (envAccessError) {
          console.log('📝 Could not access import.meta.env keys');
        }
      }
    }
    
    return config;
    
  } catch (error) {
    console.warn('⚠️ Error creating configuration:', error);
    return FALLBACK_CONFIG;
  }
};

// Create the configuration immediately
const appConfig = createConfig();

// Export the configuration
export const getConfig = (): AppConfig => appConfig;

// Export config as direct access to the created configuration
export const config = appConfig;

// Refresh function that recreates the configuration
export const refreshConfig = (): AppConfig => {
  const newConfig = createConfig();
  // Update the config object properties
  Object.assign(appConfig, newConfig);
  return appConfig;
};

// Security utilities
export const isSecureContext = () => {
  try {
    if (typeof window === 'undefined') {
      return true; // Assume secure in server-side context
    }
    
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  } catch (error) {
    console.warn('⚠️ Could not check secure context:', error);
    return false;
  }
};

export const logSecurityWarning = (message: string) => {
  const cfg = getConfig();
  if (cfg.isDevelopment) {
    console.warn('🔒 Security Warning:', message);
  }
};

// Mask sensitive data for logging
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars * 2) {
    return '***';
  }
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  return `${start}${'*'.repeat(data.length - visibleChars * 2)}${end}`;
};

// Environment info for debugging (safe to log)
export const getEnvironmentInfo = () => {
  try {
    const cfg = getConfig();
    return {
      environment: cfg.environment,
      isDevelopment: cfg.isDevelopment,
      isProduction: cfg.isProduction,
      hasSecureContext: isSecureContext(),
      supabaseConfigured: !!(cfg.supabaseUrl && cfg.supabaseAnonKey),
      supabaseUrlMasked: maskSensitiveData(cfg.supabaseUrl, 8),
      supabaseKeyMasked: maskSensitiveData(cfg.supabaseAnonKey, 8),
    };
  } catch (error) {
    console.warn('Error getting environment info:', error);
    return {
      environment: 'development',
      isDevelopment: true,
      isProduction: false,
      hasSecureContext: false,
      supabaseConfigured: false,
      supabaseUrlMasked: '***',
      supabaseKeyMasked: '***',
    };
  }
};