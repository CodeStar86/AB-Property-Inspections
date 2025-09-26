#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * AB Property Inspection Services
 * 
 * Validates environment variables for production deployment
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

// Environment validation rules
const ENV_RULES = {
  'VITE_SUPABASE_URL': {
    required: true,
    validator: (value) => value && value.includes('supabase.co'),
    error: 'Must be a valid Supabase URL (contains "supabase.co")'
  },
  'VITE_SUPABASE_ANON_KEY': {
    required: true,
    validator: (value) => value && value.startsWith('eyJ'),
    error: 'Must be a valid JWT token (starts with "eyJ")'
  },
  'VITE_OPENAI_API_KEY': {
    required: false,
    validator: (value) => !value || value.startsWith('sk-'),
    error: 'Must start with "sk-" if provided'
  },
  'VITE_APP_ENV': {
    required: false,
    validator: (value) => !value || ['development', 'production', 'staging'].includes(value),
    error: 'Must be "development", "production", or "staging"'
  },
  'VITE_ENABLE_AI_ANALYSIS': {
    required: false,
    validator: (value) => !value || ['true', 'false'].includes(value),
    error: 'Must be "true" or "false"'
  },
  'VITE_ENABLE_SECURITY_HEADERS': {
    required: false,
    validator: (value) => !value || ['true', 'false'].includes(value),
    error: 'Must be "true" or "false"'
  },
  'VITE_RATE_LIMIT_ENABLED': {
    required: false,
    validator: (value) => !value || ['true', 'false'].includes(value),
    error: 'Must be "true" or "false"'
  },
  'VITE_RATE_LIMIT_REQUESTS_PER_MINUTE': {
    required: false,
    validator: (value) => !value || (!isNaN(parseInt(value)) && parseInt(value) > 0),
    error: 'Must be a positive number'
  },
  'VITE_BASE_URL': {
    required: false,
    validator: (value) => !value || (value.startsWith('http://') || value.startsWith('https://')),
    error: 'Must be a valid URL starting with http:// or https://'
  },
  'VITE_ENABLE_PWA': {
    required: false,
    validator: (value) => !value || ['true', 'false'].includes(value),
    error: 'Must be "true" or "false"'
  }
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      vars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
  
  return vars;
}

function validateEnvironmentVariables(vars, envName = '') {
  console.log(c('blue', `\n🔍 Validating ${envName} environment variables...\n`));
  
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    configured: 0,
    total: Object.keys(ENV_RULES).length
  };
  
  // Check each environment variable
  Object.entries(ENV_RULES).forEach(([key, rule]) => {
    const value = vars[key];
    const hasValue = value && value !== '';
    
    if (rule.required && !hasValue) {
      results.errors.push({
        key,
        message: `Required variable ${key} is missing`
      });
      results.valid = false;
      console.log(c('red', `❌ ${key}: Missing (required)`));
    } else if (hasValue) {
      if (rule.validator(value)) {
        results.configured++;
        console.log(c('green', `✅ ${key}: Valid`));
      } else {
        results.errors.push({
          key,
          message: `${key}: ${rule.error}`
        });
        results.valid = false;
        console.log(c('red', `❌ ${key}: ${rule.error}`));
      }
    } else {
      console.log(c('yellow', `⚠️  ${key}: Not configured (optional)`));
    }
  });
  
  return results;
}

function checkEnvironmentSecurity(vars) {
  console.log(c('blue', '\n🔒 Security validation...\n'));
  
  const securityIssues = [];
  
  // Check for placeholder values
  const placeholders = [
    'your_supabase_url_here',
    'your_supabase_anon_key_here',
    'your_openai_api_key_here',
    'YOUR_API_KEY_HERE',
    'sk-your_key_here'
  ];
  
  Object.entries(vars).forEach(([key, value]) => {
    if (value && placeholders.some(placeholder => 
      value.toLowerCase().includes(placeholder.toLowerCase())
    )) {
      securityIssues.push(`${key} contains placeholder value`);
      console.log(c('red', `🚨 ${key}: Contains placeholder value`));
    }
  });
  
  // Check for development URLs in production
  if (vars.VITE_APP_ENV === 'production') {
    if (vars.VITE_BASE_URL && (
      vars.VITE_BASE_URL.includes('localhost') ||
      vars.VITE_BASE_URL.includes('127.0.0.1') ||
      vars.VITE_BASE_URL.includes(':3000') ||
      vars.VITE_BASE_URL.includes(':5173')
    )) {
      securityIssues.push('Base URL appears to be a development URL in production environment');
      console.log(c('red', '🚨 VITE_BASE_URL: Using development URL in production'));
    }
  }
  
  if (securityIssues.length === 0) {
    console.log(c('green', '✅ No security issues detected'));
  }
  
  return securityIssues;
}

function generateReport(results, securityIssues, envName) {
  console.log(c('cyan', `\n═══ ${envName.toUpperCase()} ENVIRONMENT REPORT ═══`));
  
  // Configuration summary
  console.log(c('white', `📊 Configuration: ${results.configured}/${results.total} variables configured`));
  
  // Status
  if (results.valid && securityIssues.length === 0) {
    console.log(c('green', '✅ Environment validation passed'));
  } else {
    console.log(c('red', '❌ Environment validation failed'));
  }
  
  // Errors
  if (results.errors.length > 0) {
    console.log(c('red', '\n🚨 Errors that must be fixed:'));
    results.errors.forEach(error => {
      console.log(c('red', `   • ${error.message}`));
    });
  }
  
  // Security issues
  if (securityIssues.length > 0) {
    console.log(c('red', '\n🔒 Security issues:'));
    securityIssues.forEach(issue => {
      console.log(c('red', `   • ${issue}`));
    });
  }
  
  // Success message
  if (results.valid && securityIssues.length === 0) {
    console.log(c('green', '\n🎉 Environment is ready for deployment!'));
  } else {
    console.log(c('yellow', '\n⚠️  Please fix the issues above before deploying to production.'));
  }
}

function main() {
  console.log(c('cyan', `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🔍 AB Property Inspection Services                    ║
║           Environment Validation                             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));
  
  const envFiles = [
    { path: '.env', name: 'Development' },
    { path: '.env.production', name: 'Production' },
    { path: '.env.local', name: 'Local Override' }
  ];
  
  let foundAny = false;
  
  envFiles.forEach(({ path: filePath, name }) => {
    const fullPath = path.join(process.cwd(), filePath);
    const vars = loadEnvFile(fullPath);
    
    if (vars) {
      foundAny = true;
      const results = validateEnvironmentVariables(vars, name);
      const securityIssues = checkEnvironmentSecurity(vars);
      generateReport(results, securityIssues, name);
    } else {
      console.log(c('yellow', `\n⚠️  ${name} environment file (${filePath}) not found`));
    }
  });
  
  if (!foundAny) {
    console.log(c('red', '\n❌ No environment files found!'));
    console.log(c('white', '\nTo create environment files:'));
    console.log(c('white', '1. Copy .env.example to .env for development'));
    console.log(c('white', '2. Run: node scripts/setup-production.js'));
    console.log(c('white', '3. Configure your variables and run this script again'));
    process.exit(1);
  }
  
  console.log(c('cyan', '\n═══ NEXT STEPS ═══'));
  console.log(c('white', '1. Fix any errors shown above'));
  console.log(c('white', '2. For deployment platforms:'));
  console.log(c('white', '   - Set these variables in your platform\'s environment settings'));
  console.log(c('white', '   - Never commit .env files to Git'));
  console.log(c('white', '3. Test your configuration:'));
  console.log(c('white', '   - npm run build (should complete without errors)'));
  console.log(c('white', '   - npm run preview (check the application works)'));
  
  console.log(c('green', '\n✅ Validation complete!'));
}

main();