/**
 * Development Tools for AB Property Inspection Services
 * Security utilities and debugging helpers
 */

import { config, getConfig, getEnvironmentInfo, maskSensitiveData } from './config';
import { logEnvironmentTest } from './envTest';

export class DevTools {
  static checkEnvironment() {
    console.group('🔧 AB Property Inspection Services - Environment Check');
    
    try {
      const cfg = getConfig();
      console.log('Configuration loaded:', {
        hasSupabaseUrl: !!cfg.supabaseUrl,
        hasSupabaseKey: !!cfg.supabaseAnonKey,
        environment: cfg.environment,
        isDevelopment: cfg.isDevelopment
      });
      
      // Check for common issues
      const issues: string[] = [];
      
      if (!cfg.supabaseUrl) {
        issues.push('Missing VITE_SUPABASE_URL');
      }
      
      if (!cfg.supabaseAnonKey) {
        issues.push('Missing VITE_SUPABASE_ANON_KEY');
      }
      
      if (cfg.supabaseUrl && !cfg.supabaseUrl.includes('supabase.co')) {
        issues.push('Invalid Supabase URL format');
      }
      
      // Check if we're using fallback configuration
      if (cfg.supabaseUrl === 'https://wlxmcgoxsepwbnfdgxvq.supabase.co') {
        console.log('📍 Using configured Supabase project (expected for this app)');
      } else {
        console.log('🎯 Using custom Supabase configuration');
      }
      
      if (issues.length > 0) {
        console.error('❌ Configuration Issues:', issues);
        console.log('💡 Check your .env.local file and restart dev server');
      } else {
        console.log('✅ Environment configuration is working!');
      }
    } catch (error) {
      console.error('❌ Error checking environment:', error);
    }
    
    console.groupEnd();
  }
  
  static checkSecurity() {
    console.group('🔒 Security Status Check');
    
    // Check if we're in a secure context
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost';
    
    console.log('Secure Context:', isSecure ? '✅ Yes' : '⚠️ No (HTTP)');
    console.log('Environment:', config.environment);
    
    // Check for environment file
    const hasEnvFile = !!(import.meta.env.VITE_SUPABASE_URL);
    console.log('.env.local loaded:', hasEnvFile ? '✅ Yes' : '❌ No');
    
    if (!hasEnvFile) {
      console.warn('⚠️ Environment variables not loaded. Check .env.local file exists.');
    }
    
    console.groupEnd();
  }
  
  static async testSupabaseConnection() {
    console.group('🔌 Supabase Connection Test');
    
    try {
      // Basic URL validation
      const url = new URL(config.supabaseUrl);
      console.log('Supabase URL:', maskSensitiveData(config.supabaseUrl, 12));
      console.log('Project ID:', url.hostname.split('.')[0]);
      
      // Test if the URL is reachable (basic connectivity)
      const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': config.supabaseAnonKey,
        },
      });
      
      if (response.ok || response.status === 200) {
        console.log('✅ Supabase connection successful');
      } else {
        console.log('⚠️ Supabase responded with status:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Supabase connection failed:', error instanceof Error ? error.message : error);
    }
    
    console.groupEnd();
  }
  
  static showCredentialStatus() {
    console.group('🔑 Credential Status');
    
    const credentials = {
      'Supabase URL': !!config.supabaseUrl,
      'Supabase Key': !!config.supabaseAnonKey,
      'Environment': config.environment,
    };
    
    Object.entries(credentials).forEach(([key, value]) => {
      const status = typeof value === 'boolean' 
        ? (value ? '✅ Configured' : '❌ Missing')
        : `📝 ${value}`;
      console.log(`${key}:`, status);
    });
    
    console.groupEnd();
  }
  
  static runFullDiagnostic() {
    console.log('🚀 Running AB Property Inspection Services Diagnostic...\n');
    
    try {
      // First, test raw environment variable access
      try {
        logEnvironmentTest();
      } catch (envTestError) {
        console.warn('⚠️ Environment test failed:', envTestError);
        console.log('🔧 This is usually due to import.meta.env not being available yet');
      }
      
      this.checkEnvironment();
      this.checkSecurity();
      this.showCredentialStatus();
      
      try {
        const cfg = getConfig();
        if (cfg.isDevelopment) {
          this.testSupabaseConnection();
        }
      } catch (configError) {
        console.warn('⚠️ Configuration access failed:', configError);
      }
      
      console.log('\n✅ Diagnostic complete! Check the output above for any issues.');
    } catch (error) {
      console.error('❌ Error during diagnostic:', error);
      console.log('💡 This might indicate a configuration issue');
      console.log('🔧 The app should still work with fallback configuration');
    }
  }
}

// Manual diagnostic runner (called from App.tsx after initialization)
export const runStartupDiagnostic = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        console.log('\n🔧 AB Property Inspection Services - Startup Diagnostic');
        console.log('═══════════════════════════════════════════════════');
        
        // Run diagnostic with complete error isolation
        try {
          DevTools.runFullDiagnostic();
        } catch (diagnosticError) {
          console.error('⚠️ Diagnostic failed safely:', diagnosticError);
          console.log('🔧 Basic functionality will continue to work');
        }
        
        // Show configuration status with safe access
        try {
          const cfg = getConfig();
          if (cfg && cfg.supabaseUrl !== 'https://wlxmcgoxsepwbnfdgxvq.supabase.co') {
            console.log('\n🎉 SUCCESS: Custom environment variables loaded!');
          } else {
            console.log('\n⚠️ NOTICE: Using fallback configuration');
            console.log('🔧 This is normal for initial setup or if .env.local is missing');
          }
        } catch (configError) {
          console.warn('⚠️ Could not check configuration status:', configError);
          console.log('🔧 App will use safe defaults');
        }
        
        console.log('═══════════════════════════════════════════════════\n');
      } catch (error) {
        console.error('❌ Error in startup diagnostic:', error);
        console.log('🔧 App will continue with basic functionality');
      }
    }, 100);
  }
};

// Auto-run diagnostic when devTools module is imported (with safety)
try {
  console.log('🔧 DevTools module loaded, running startup diagnostic...');
  runStartupDiagnostic();
} catch (startupError) {
  console.warn('⚠️ DevTools startup diagnostic failed:', startupError);
  console.log('🔧 The app will continue with basic functionality');
}

export default DevTools;