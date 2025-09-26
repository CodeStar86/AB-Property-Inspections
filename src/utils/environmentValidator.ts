/**
 * Environment Validator - Comprehensive validation for app configuration
 * Ensures security and proper setup of environment variables
 */

interface ValidationResult {
  isValid: boolean;
  level: 'error' | 'warning' | 'info' | 'success';
  message: string;
  key?: string;
  recommendation?: string;
}

interface EnvironmentValidation {
  overall: 'valid' | 'warning' | 'error';
  results: ValidationResult[];
  securityScore: number;
}

/**
 * Validate all environment variables and configuration
 */
export function validateEnvironment(): EnvironmentValidation {
  const results: ValidationResult[] = [];
  let securityScore = 0;
  const maxScore = 100;

  // Check if environment variables are available
  const hasEnv = typeof import.meta !== 'undefined' && 
                import.meta && 
                import.meta.env && 
                typeof import.meta.env === 'object';

  if (!hasEnv) {
    results.push({
      isValid: false,
      level: 'error',
      message: 'Environment variables not accessible',
      recommendation: 'Ensure the application is running in a proper Vite environment'
    });
    return {
      overall: 'error',
      results,
      securityScore: 0
    };
  }

  // 1. Check Supabase Configuration (30 points)
  let supabaseUrl, supabaseKey;
  try {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  } catch (error) {
    results.push({
      isValid: false,
      level: 'error',
      message: 'Could not access Supabase environment variables',
      recommendation: 'Check your environment configuration'
    });
    supabaseUrl = undefined;
    supabaseKey = undefined;
  }

  if (!supabaseUrl || supabaseUrl.includes('your_supabase_url')) {
    results.push({
      isValid: false,
      level: 'error',
      message: 'Supabase URL not configured',
      key: 'VITE_SUPABASE_URL',
      recommendation: 'Add your Supabase project URL to the .env file'
    });
  } else if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    results.push({
      isValid: false,
      level: 'warning',
      message: 'Supabase URL format may be invalid',
      key: 'VITE_SUPABASE_URL',
      recommendation: 'Ensure URL follows format: https://your-project.supabase.co'
    });
    securityScore += 15;
  } else {
    results.push({
      isValid: true,
      level: 'success',
      message: 'Supabase URL configured correctly',
      key: 'VITE_SUPABASE_URL'
    });
    securityScore += 15;
  }

  if (!supabaseKey || supabaseKey.includes('your_supabase_key')) {
    results.push({
      isValid: false,
      level: 'error',
      message: 'Supabase anon key not configured',
      key: 'VITE_SUPABASE_ANON_KEY',
      recommendation: 'Add your Supabase anon key to the .env file'
    });
  } else if (!supabaseKey.startsWith('eyJ') || supabaseKey.length < 100) {
    results.push({
      isValid: false,
      level: 'warning',
      message: 'Supabase anon key format may be invalid',
      key: 'VITE_SUPABASE_ANON_KEY',
      recommendation: 'Ensure key is copied correctly from Supabase dashboard'
    });
    securityScore += 7;
  } else {
    results.push({
      isValid: true,
      level: 'success',
      message: 'Supabase anon key configured correctly',
      key: 'VITE_SUPABASE_ANON_KEY'
    });
    securityScore += 15;
  }

  // 2. Check OpenAI Configuration (25 points)
  let openaiKey;
  try {
    openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  } catch (error) {
    console.warn('Could not access OpenAI API key:', error);
    openaiKey = undefined;
  }

  if (!openaiKey || openaiKey === 'your_openai_api_key_here' || openaiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    results.push({
      isValid: true, // Not critical for app to function
      level: 'info',
      message: 'OpenAI API key not configured - AI features will be disabled',
      key: 'VITE_OPENAI_API_KEY',
      recommendation: 'Add OpenAI API key to enable AI-powered room analysis'
    });
    securityScore += 5; // Partial points for not having potential security risk
  } else if (!openaiKey.startsWith('sk-')) {
    results.push({
      isValid: false,
      level: 'warning',
      message: 'OpenAI API key format appears invalid',
      key: 'VITE_OPENAI_API_KEY',
      recommendation: 'Ensure key starts with "sk-" and is copied correctly from OpenAI dashboard'
    });
    securityScore += 10;
  } else if (openaiKey.length < 50) {
    results.push({
      isValid: false,
      level: 'warning',
      message: 'OpenAI API key appears too short',
      key: 'VITE_OPENAI_API_KEY',
      recommendation: 'Verify the complete API key was copied from OpenAI dashboard'
    });
    securityScore += 15;
  } else {
    results.push({
      isValid: true,
      level: 'success',
      message: 'OpenAI API key configured correctly',
      key: 'VITE_OPENAI_API_KEY'
    });
    securityScore += 25;
  }

  // 3. Check Security Context (20 points)
  const isSecure = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

  if (!isSecure) {
    results.push({
      isValid: false,
      level: 'error',
      message: 'Application not running in secure context',
      recommendation: 'Use HTTPS in production to ensure secure data transmission'
    });
  } else if (window.location.protocol === 'https:') {
    results.push({
      isValid: true,
      level: 'success',
      message: 'Secure HTTPS connection established'
    });
    securityScore += 20;
  } else {
    results.push({
      isValid: true,
      level: 'info',
      message: 'Development environment - localhost is secure'
    });
    securityScore += 20;
  }

  // 4. Check Environment Type Configuration (15 points)
  let environment, isProduction;
  try {
    environment = import.meta.env.VITE_APP_ENV || 'development';
    isProduction = environment === 'production';

    if (isProduction) {
      // Production-specific checks
      try {
        const devToolsEnabled = import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
        if (devToolsEnabled) {
          results.push({
            isValid: false,
            level: 'error',
            message: 'Development tools enabled in production',
            key: 'VITE_ENABLE_DEV_TOOLS',
            recommendation: 'Set VITE_ENABLE_DEV_TOOLS=false for production'
          });
        } else {
          securityScore += 15;
        }
      } catch (error) {
        console.warn('Could not check development tools setting:', error);
        securityScore += 10; // Partial points
      }
    } else {
      results.push({
        isValid: true,
        level: 'info',
        message: 'Development environment configured',
        key: 'VITE_APP_ENV'
      });
      securityScore += 15;
    }
  } catch (error) {
    console.warn('Could not access environment type:', error);
    results.push({
      isValid: false,
      level: 'warning',
      message: 'Could not determine environment type',
      key: 'VITE_APP_ENV',
      recommendation: 'Ensure VITE_APP_ENV is properly set'
    });
    securityScore += 5; // Minimal points
  }

  // 5. Check for Common Security Issues (10 points)
  try {
    // Check if sensitive data might be exposed
    let envKeys;
    try {
      envKeys = Object.keys(import.meta.env);
    } catch (error) {
      console.warn('Could not access environment variable keys:', error);
      securityScore += 10; // Give full points if we can't check
      return;
    }

    const suspiciousKeys = envKeys.filter(key => 
      key.toLowerCase().includes('password') || 
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('private')
    );

    if (suspiciousKeys.length > 0) {
      results.push({
        isValid: false,
        level: 'warning',
        message: `Potentially sensitive environment variables detected: ${suspiciousKeys.join(', ')}`,
        recommendation: 'Ensure sensitive data is properly secured and not exposed to client'
      });
      securityScore += 5;
    } else {
      securityScore += 10;
    }
  } catch (error) {
    console.warn('Error checking for security issues:', error);
    securityScore += 10; // Give full points if we can't check
  }

  // Determine overall status
  const errors = results.filter(r => r.level === 'error' && !r.isValid);
  const warnings = results.filter(r => r.level === 'warning' && !r.isValid);

  let overall: 'valid' | 'warning' | 'error';
  if (errors.length > 0) {
    overall = 'error';
  } else if (warnings.length > 0) {
    overall = 'warning';
  } else {
    overall = 'valid';
  }

  return {
    overall,
    results,
    securityScore: Math.round(securityScore)
  };
}

/**
 * Get critical missing environment variables
 */
export function getCriticalMissingEnvVars(): string[] {
  const critical = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  return critical.filter(key => {
    const value = import.meta.env[key];
    return !value || value.includes('your_') || value.includes('_here');
  });
}

/**
 * Check if app can function with current environment
 */
export function canAppFunction(): boolean {
  const criticalMissing = getCriticalMissingEnvVars();
  return criticalMissing.length === 0;
}

/**
 * Get environment security recommendations
 */
export function getSecurityRecommendations(): string[] {
  const validation = validateEnvironment();
  return validation.results
    .filter(r => r.recommendation && !r.isValid)
    .map(r => r.recommendation!);
}

/**
 * Log security status to console (development only)
 */
export function logSecurityStatus(): void {
  const isDevelopment = import.meta.env.VITE_APP_ENV !== 'production';
  
  if (!isDevelopment) return;

  const validation = validateEnvironment();
  
  console.group('🔒 Security Status');
  console.log(`Overall Status: ${validation.overall.toUpperCase()}`);
  console.log(`Security Score: ${validation.securityScore}/100`);
  
  validation.results.forEach(result => {
    const icon = result.level === 'error' ? '❌' : 
                 result.level === 'warning' ? '⚠️' : 
                 result.level === 'success' ? '✅' : 'ℹ️';
    
    console.log(`${icon} ${result.message}${result.key ? ` (${result.key})` : ''}`);
    
    if (result.recommendation) {
      console.log(`   💡 ${result.recommendation}`);
    }
  });
  
  console.groupEnd();
}

/**
 * Mask sensitive data for safe logging
 */
export function maskEnvironmentData(data: string, visibleChars: number = 6): string {
  if (!data || data.length <= visibleChars * 2) {
    return '***';
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(Math.max(3, data.length - visibleChars * 2));
  
  return `${start}${masked}${end}`;
}

export default validateEnvironment;