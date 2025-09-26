#!/usr/bin/env node

/**
 * Immediate Environment Check
 * Verifies current .env.local configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AB Property Inspection Services - Environment Check\n');

const envLocalPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file found');
  
  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    
    console.log('\n📋 Current .env.local contents:');
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));
    
    // Parse variables
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const vars = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    console.log('\n🔑 Parsed variables:');
    Object.keys(vars).forEach(key => {
      if (key.includes('PASSWORD') || key.includes('KEY')) {
        console.log(`   ${key}: ${'*'.repeat(8)}...`);
      } else {
        console.log(`   ${key}: ${vars[key].substring(0, 30)}${vars[key].length > 30 ? '...' : ''}`);
      }
    });
    
    // Check required VITE variables
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missing = required.filter(key => !vars[key]);
    
    if (missing.length === 0) {
      console.log('\n🎉 All required VITE_ variables are present!');
      console.log('✅ Configuration should work correctly');
    } else {
      console.log('\n❌ Missing required variables:', missing);
      console.log('⚠️ This will cause fallback configuration to be used');
    }
    
  } catch (error) {
    console.log('❌ Error reading .env.local:', error.message);
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('💡 This will cause fallback configuration to be used');
  
  console.log('\n🔧 Creating .env.local file now...');
  
  const envContent = `VITE_SUPABASE_URL=https://wlxmcgoxsepwbnfdgxvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s
ADMIN_EMAIL=r.depala86@gmail.com
ADMIN_PASSWORD=Bharti1956!
ADMIN_NAME=System Administrator
VITE_APP_ENV=development`;
  
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Created .env.local file with working configuration');
}

console.log('\n🚀 Next steps:');
console.log('1. Restart your development server: npm run dev');
console.log('2. The environment variable warnings should be resolved');
console.log('3. Check browser console for successful configuration loading');