#!/usr/bin/env node

/**
 * Quick Environment Configuration Test
 * Verifies .env.local file exists and has correct format
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 AB Property Inspection Services - Configuration Test\n');

const envLocalPath = path.join(__dirname, '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found');
  console.log('💡 Creating .env.local file...\n');
  
  const envContent = `VITE_SUPABASE_URL=https://wlxmcgoxsepwbnfdgxvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s
ADMIN_EMAIL=r.depala86@gmail.com
ADMIN_PASSWORD=Bharti1956!
ADMIN_NAME=System Administrator
VITE_APP_ENV=development`;
  
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Created .env.local file');
}

// Read and validate .env.local
try {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('📋 .env.local file contents:');
  
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const envVars = {};
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
      console.log(`   ✅ ${key.trim()}: configured`);
    }
  });
  
  // Check required variables
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !envVars[key]);
  
  if (missing.length === 0) {
    console.log('\n🎉 All required environment variables are present!');
    console.log('🚀 Ready to start development server: npm run dev');
  } else {
    console.log('\n❌ Missing required variables:', missing);
  }
  
} catch (error) {
  console.log('❌ Error reading .env.local:', error.message);
}

console.log('\n🔧 If you still see errors after running npm run dev:');
console.log('   1. Stop the development server (Ctrl+C)');
console.log('   2. Run: npm run dev');
console.log('   3. Check browser console for diagnostic messages');