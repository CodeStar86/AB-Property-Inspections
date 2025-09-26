#!/usr/bin/env node

/**
 * Environment Variables Fix Script
 * Creates proper .env.local file with correct format
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AB Property Inspection Services - Environment Fix\n');

const envLocalPath = path.join(__dirname, '.env.local');

// Correct .env.local content
const envContent = `# AB Property Inspection Services - Local Environment Variables
# This file contains your actual credentials - NEVER commit to git!

# Supabase Configuration
VITE_SUPABASE_URL=https://wlxmcgoxsepwbnfdgxvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s

# Admin Credentials (Server-side only)
ADMIN_EMAIL=r.depala86@gmail.com
ADMIN_PASSWORD=Bharti1956!
ADMIN_NAME=System Administrator

# Application Security
VITE_APP_ENV=development
`;

try {
  // Backup existing file if it exists
  if (fs.existsSync(envLocalPath)) {
    const backupPath = envLocalPath + '.backup.' + Date.now();
    fs.copyFileSync(envLocalPath, backupPath);
    console.log('📋 Existing .env.local backed up to:', path.basename(backupPath));
  }
  
  // Write new .env.local file
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Created new .env.local file with correct format');
  
  // Verify the file was created
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const hasRequired = content.includes('VITE_SUPABASE_URL') && content.includes('VITE_SUPABASE_ANON_KEY');
    
    if (hasRequired) {
      console.log('✅ Environment variables verified in .env.local');
    } else {
      console.log('❌ Environment variables not found in .env.local');
    }
  }
  
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. The environment variable errors should be resolved');
  console.log('3. Check browser console for successful diagnostic messages');
  
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  
  console.log('\n🔧 Manual fix:');
  console.log('1. Create .env.local file in project root');
  console.log('2. Copy content from .env.example');
  console.log('3. Add your actual Supabase credentials');
}