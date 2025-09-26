#!/usr/bin/env node

/**
 * Diagnostic Error Fix Script
 * Ensures environment variables are accessible and diagnostics don't crash
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AB Property Inspection Services - Diagnostic Fix\n');

// 1. Ensure .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
const envContent = `VITE_SUPABASE_URL=https://wlxmcgoxsepwbnfdgxvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s
ADMIN_EMAIL=r.depala86@gmail.com
ADMIN_PASSWORD=Bharti1956!
ADMIN_NAME=System Administrator
VITE_APP_ENV=development`;

if (!fs.existsSync(envLocalPath)) {
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file exists');
}

// 2. Verify .env.local content
try {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL=',
    'VITE_SUPABASE_ANON_KEY=',
    'ADMIN_EMAIL=',
    'ADMIN_PASSWORD=',
    'VITE_APP_ENV='
  ];
  
  const missingVars = requiredVars.filter(varDef => !content.includes(varDef));
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables present');
  } else {
    console.log('❌ Missing environment variable definitions:', missingVars);
    console.log('🔧 Recreating .env.local with complete content...');
    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ .env.local recreated with all variables');
  }
} catch (error) {
  console.log('❌ Error reading .env.local:', error.message);
}

console.log('\n🔧 What was fixed:');
console.log('   ✅ Added null checks for import.meta.env in envTest.ts');
console.log('   ✅ Enhanced error handling in devTools diagnostic');
console.log('   ✅ Added safety wrapper for envTest failures');
console.log('   ✅ Protected diagnostic startup from crashes');
console.log('   ✅ Ensured .env.local file exists with all required variables');

console.log('\n🚀 Expected results after npm run dev:');
console.log('   ✅ No more "Cannot read properties of undefined" errors');
console.log('   ✅ Diagnostic will run safely even if import.meta.env is undefined');
console.log('   ✅ App will continue working with fallback configuration');
console.log('   ✅ Development tools will load without crashing');

console.log('\n📋 Next steps:');
console.log('   1. Restart development server: npm run dev');
console.log('   2. Diagnostic warnings are OK - they indicate fallback mode');
console.log('   3. Look for "✅ Development tools loaded" message');

console.log('\n✅ Diagnostic error fix complete!');