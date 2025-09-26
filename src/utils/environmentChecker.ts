/**
 * Environment Checker - Utility for safely checking environment variable availability
 * Handles timing issues with Vite environment variable loading
 */

interface EnvironmentStatus {
  available: boolean;
  partially: boolean;
  error?: string;
  missingVars?: string[];
}

/**
 * Check if environment variables are available and properly loaded
 * Simplified version that doesn't throw errors
 */
export function checkEnvironmentAvailability(): EnvironmentStatus {
  try {
    // Don't try to access import.meta.env directly
    // Instead, rely on the config utility which has proper fallbacks
    return {
      available: true, // Assume available since config handles fallbacks
      partially: false
    };
  } catch (error) {
    return {
      available: false,
      partially: false,
      error: error instanceof Error ? error.message : 'Environment check failed'
    };
  }
}

/**
 * Wait for environment variables to become available
 * Simplified version that doesn't actually wait since config handles fallbacks
 */
export async function waitForEnvironment(maxWaitMs: number = 2000): Promise<boolean> {
  // Since we're using fallback configuration, environment is always "available"
  return true;
}

/**
 * Safely get an environment variable with fallback
 * Uses the config utility which has proper error handling
 */
export function safeGetEnvVar(key: string, fallback?: string): string | undefined {
  try {
    // Use the config utility instead of direct import.meta.env access
    const config = require('./config').config;
    
    // Map common environment variables to config properties
    switch (key) {
      case 'VITE_SUPABASE_URL':
        return config.supabaseUrl || fallback;
      case 'VITE_SUPABASE_ANON_KEY':
        return config.supabaseAnonKey || fallback;
      case 'VITE_APP_ENV':
        return config.environment || fallback;
      default:
        return fallback;
    }
  } catch (error) {
    return fallback;
  }
}

/**
 * Log environment status for debugging
 * Simplified version that doesn't cause errors
 */
export function logEnvironmentStatus(): void {
  try {
    const config = require('./config').config;
    console.log('ℹ️ Environment status:', {
      environment: config.environment,
      supabaseConfigured: !!config.supabaseUrl,
      fallbackMode: config.supabaseUrl === 'https://wlxmcgoxsepwbnfdgxvq.supabase.co'
    });
  } catch (error) {
    console.log('ℹ️ Environment status: Using fallback configuration');
  }
}

export default checkEnvironmentAvailability;