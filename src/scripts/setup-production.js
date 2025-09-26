#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * AB Property Inspection Services
 * 
 * This script helps validate and set up environment variables for production deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Required environment variables for production
const REQUIRED_VARS = {
  'VITE_SUPABASE_URL': {
    description: 'Your Supabase project URL',
    example: 'https://your-project.supabase.co',
    validator: (value) => value && value.includes('supabase.co'),
    required: true
  },
  'VITE_SUPABASE_ANON_KEY': {
    description: 'Your Supabase anonymous key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX...',
    validator: (value) => value && value.startsWith('eyJ'),
    required: true
  }
};

// Optional environment variables
const OPTIONAL_VARS = {
  'VITE_OPENAI_API_KEY': {
    description: 'OpenAI API key for AI-powered room analysis',
    example: 'sk-proj-...',
    validator: (value) => !value || value.startsWith('sk-'),
    required: false
  },
  'VITE_ENABLE_AI_ANALYSIS': {
    description: 'Enable AI analysis features',
    example: 'true',
    validator: (value) => !value || ['true', 'false'].includes(value),
    required: false,
    default: 'true'
  },
  'VITE_ENABLE_SECURITY_HEADERS': {
    description: 'Enable security headers in production',
    example: 'true',
    validator: (value) => !value || ['true', 'false'].includes(value),
    required: false,
    default: 'true'
  },
  'VITE_RATE_LIMIT_ENABLED': {
    description: 'Enable rate limiting',
    example: 'true',
    validator: (value) => !value || ['true', 'false'].includes(value),
    required: false,
    default: 'true'
  },
  'VITE_BASE_URL': {
    description: 'Base URL for your application',
    example: 'https://your-domain.com',
    validator: (value) => !value || value.startsWith('http'),
    required: false
  },
  'VITE_APP_NAME': {
    description: 'Application name',
    example: 'AB Property Inspection Services',
    validator: () => true,
    required: false,
    default: 'AB Property Inspection Services'
  }
};

console.log(c('cyan', `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🚀 AB Property Inspection Services                    ║
║           Production Environment Setup                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`));

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function validateEnvironmentVar(key, config, existingValue = '') {
  const { description, example, validator, required, default: defaultValue } = config;
  
  console.log(c('blue', `\n📝 ${key}`));
  console.log(c('white', `   ${description}`));
  console.log(c('yellow', `   Example: ${example}`));
  
  if (existingValue) {
    console.log(c('green', `   Current: ${existingValue.slice(0, 20)}${existingValue.length > 20 ? '...' : ''}`));
  }
  
  let value = existingValue;
  
  if (!value) {
    const prompt = required 
      ? c('red', `   Required - Enter value: `)
      : c('cyan', `   Optional - Enter value (or press Enter${defaultValue ? ` for "${defaultValue}"` : ' to skip'}): `);
    
    value = await question(prompt);
    
    if (!value && defaultValue) {
      value = defaultValue;
    }
  }
  
  // Validate the value
  if (required && !value) {
    console.log(c('red', `   ❌ ${key} is required for production deployment!`));
    return await validateEnvironmentVar(key, config, value);
  }
  
  if (value && !validator(value)) {
    console.log(c('red', `   ❌ Invalid format for ${key}!`));
    return await validateEnvironmentVar(key, config, '');
  }
  
  if (value) {
    console.log(c('green', `   ✅ ${key} configured`));
  } else {
    console.log(c('yellow', `   ⚠️  ${key} skipped (optional)`));
  }
  
  return value;
}

async function loadExistingEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  
  let existingVars = {};
  
  // Try to load from .env first, then .env.production
  for (const filePath of [envPath, prodEnvPath]) {
    if (fs.existsSync(filePath)) {
      console.log(c('green', `📁 Found existing environment file: ${path.basename(filePath)}`));
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          existingVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
      break;
    }
  }
  
  return existingVars;
}

async function generateEnvFile(variables) {
  const envContent = `# AB Property Inspection Services - Production Environment
# Generated by setup script on ${new Date().toISOString()}

# ================================================================
# 🚀 PRODUCTION CONFIGURATION
# ================================================================

VITE_APP_ENV=production
VITE_ENABLE_DEV_TOOLS=false

# ================================================================
# 🔐 SUPABASE CONFIGURATION
# ================================================================

${variables.VITE_SUPABASE_URL ? `VITE_SUPABASE_URL=${variables.VITE_SUPABASE_URL}` : '# VITE_SUPABASE_URL=https://your-project.supabase.co'}
${variables.VITE_SUPABASE_ANON_KEY ? `VITE_SUPABASE_ANON_KEY=${variables.VITE_SUPABASE_ANON_KEY}` : '# VITE_SUPABASE_ANON_KEY=your_anon_key_here'}

# ================================================================
# 🤖 OPENAI API CONFIGURATION
# ================================================================

${variables.VITE_OPENAI_API_KEY ? `VITE_OPENAI_API_KEY=${variables.VITE_OPENAI_API_KEY}` : '# VITE_OPENAI_API_KEY=sk-proj-your_key_here'}
${variables.VITE_ENABLE_AI_ANALYSIS ? `VITE_ENABLE_AI_ANALYSIS=${variables.VITE_ENABLE_AI_ANALYSIS}` : 'VITE_ENABLE_AI_ANALYSIS=true'}

# ================================================================
# 🛡️ SECURITY CONFIGURATION
# ================================================================

${variables.VITE_ENABLE_SECURITY_HEADERS ? `VITE_ENABLE_SECURITY_HEADERS=${variables.VITE_ENABLE_SECURITY_HEADERS}` : 'VITE_ENABLE_SECURITY_HEADERS=true'}
${variables.VITE_RATE_LIMIT_ENABLED ? `VITE_RATE_LIMIT_ENABLED=${variables.VITE_RATE_LIMIT_ENABLED}` : 'VITE_RATE_LIMIT_ENABLED=true'}
VITE_RATE_LIMIT_REQUESTS_PER_MINUTE=30

# ================================================================
# 🌐 APPLICATION CONFIGURATION
# ================================================================

${variables.VITE_BASE_URL ? `VITE_BASE_URL=${variables.VITE_BASE_URL}` : '# VITE_BASE_URL=https://your-domain.com'}
${variables.VITE_APP_NAME ? `VITE_APP_NAME="${variables.VITE_APP_NAME}"` : 'VITE_APP_NAME="AB Property Inspection Services"'}

# ================================================================
# 📱 PWA CONFIGURATION
# ================================================================

VITE_ENABLE_PWA=true

# ================================================================
# 📊 MONITORING (Optional)
# ================================================================

# VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# VITE_GA_TRACKING_ID=G-XXXXXXXXXX
`;

  return envContent;
}

async function main() {
  try {
    console.log(c('white', '\n🔍 Checking for existing environment configuration...\n'));
    
    const existingVars = await loadExistingEnvFile();
    const collectedVars = {};
    
    // Process required variables
    console.log(c('magenta', '\n═══ REQUIRED CONFIGURATION ═══'));
    for (const [key, config] of Object.entries(REQUIRED_VARS)) {
      collectedVars[key] = await validateEnvironmentVar(key, config, existingVars[key]);
    }
    
    // Check if all required variables are set
    const missingRequired = Object.entries(REQUIRED_VARS)
      .filter(([key]) => !collectedVars[key])
      .map(([key]) => key);
    
    if (missingRequired.length > 0) {
      console.log(c('red', `\n❌ Missing required variables: ${missingRequired.join(', ')}`));
      console.log(c('yellow', '\n⚠️  Your app will use fallback configuration but may have limited functionality.'));
      
      const proceed = await question(c('cyan', '\nDo you want to continue anyway? (y/N): '));
      if (proceed.toLowerCase() !== 'y') {
        console.log(c('yellow', '\n👋 Setup cancelled. Please configure the required variables and try again.'));
        process.exit(0);
      }
    }
    
    // Process optional variables
    console.log(c('magenta', '\n═══ OPTIONAL CONFIGURATION ═══'));
    for (const [key, config] of Object.entries(OPTIONAL_VARS)) {
      collectedVars[key] = await validateEnvironmentVar(key, config, existingVars[key]);
    }
    
    // Generate environment file
    console.log(c('blue', '\n📄 Generating production environment file...\n'));
    
    const envContent = await generateEnvFile(collectedVars);
    const envPath = path.join(process.cwd(), '.env.production');
    
    fs.writeFileSync(envPath, envContent);
    
    console.log(c('green', `✅ Environment file created: .env.production`));
    
    // Summary
    console.log(c('cyan', '\n═══ SETUP SUMMARY ═══'));
    console.log(c('green', '✅ Required variables configured:'));
    Object.entries(REQUIRED_VARS).forEach(([key]) => {
      const status = collectedVars[key] ? '✓' : '✗';
      const color = collectedVars[key] ? 'green' : 'red';
      console.log(c(color, `   ${status} ${key}`));
    });
    
    const configuredOptional = Object.entries(OPTIONAL_VARS)
      .filter(([key]) => collectedVars[key])
      .map(([key]) => key);
    
    if (configuredOptional.length > 0) {
      console.log(c('green', '\n✅ Optional variables configured:'));
      configuredOptional.forEach(key => {
        console.log(c('green', `   ✓ ${key}`));
      });
    }
    
    // Next steps
    console.log(c('cyan', '\n═══ NEXT STEPS ═══'));
    console.log(c('white', '1. Review the generated .env.production file'));
    console.log(c('white', '2. For deployment platforms (Vercel, Netlify, etc.):'));
    console.log(c('white', '   - Add these variables to your platform\'s environment settings'));
    console.log(c('white', '   - DO NOT commit .env.production to Git'));
    console.log(c('white', '3. For local production testing:'));
    console.log(c('white', '   - Copy .env.production to .env'));
    console.log(c('white', '   - Run: npm run build && npm run preview'));
    console.log(c('white', '4. Check the PRODUCTION_DEPLOYMENT.md guide for platform-specific instructions'));
    
    console.log(c('green', '\n🎉 Production environment setup complete!'));
    console.log(c('yellow', '\n⚠️  Remember: Never commit .env files to version control!'));
    
  } catch (error) {
    console.error(c('red', '\n❌ Setup failed:'), error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(c('yellow', '\n\n👋 Setup cancelled by user.'));
  rl.close();
  process.exit(0);
});

main();