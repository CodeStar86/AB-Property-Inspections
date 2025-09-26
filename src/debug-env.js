#!/usr/bin/env node

/**
 * Environment Variables Debug Script
 * Checks if .env.local file exists and can be parsed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AB Property Inspection Services - Environment Debug\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('📁 Checking environment files...\n');

if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file exists');
  
  try {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log('📋 Environment variables in .env.local:');
    lines.forEach(line => {
      const [key] = line.split('=');
      if (key) {
        console.log(`   - ${key.trim()}`);
      }
    });
    
    // Check for required variables
    const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const hasRequired = requiredVars.every(varName => 
      envContent.includes(varName)
    );
    
    if (hasRequired) {
      console.log('✅ All required VITE_* variables are present');
    } else {
      console.log('❌ Missing required VITE_* variables');
      requiredVars.forEach(varName => {
        if (!envContent.includes(varName)) {
          console.log(`   - Missing: ${varName}`);
        }
      });
    }
    
  } catch (error) {
    console.log('❌ Error reading .env.local:', error.message);
  }
} else {
  console.log('❌ .env.local file not found');
}

if (fs.existsSync(envExamplePath)) {
  console.log('✅ .env.example file exists');
} else {
  console.log('❌ .env.example file not found');
}

console.log('\n🔧 Next steps:');
console.log('1. Ensure .env.local exists in project root');
console.log('2. Restart your development server: npm run dev');
console.log('3. Check browser console for diagnostic messages');

console.log('\n💡 If issues persist, try:');
console.log('   cp .env.example .env.local');
console.log('   # Then edit .env.local with your actual values');
console.log('   npm run dev');