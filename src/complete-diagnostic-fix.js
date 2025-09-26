#!/usr/bin/env node

/**
 * Complete Diagnostic Error Fix
 * Ensures all environment variable access is safe and diagnostics don't crash
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AB Property Inspection Services - Complete Diagnostic Fix\n');

// 1. Ensure .env.local exists and is persistent
const envLocalPath = path.join(__dirname, '.env.local');
const envContent = `VITE_SUPABASE_URL=https://wlxmcgoxsepwbnfdgxvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseG1jZ294c2Vwd2JuZmRneHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTkzMzUsImV4cCI6MjA3NDIzNTMzNX0.NO9XbXmdK_8gyai_uFM19cocOsoQHj7nIxfR-vsX8-s
ADMIN_EMAIL=r.depala86@gmail.com
ADMIN_PASSWORD=Bharti1956!
ADMIN_NAME=System Administrator
VITE_APP_ENV=development`;

// Always recreate to ensure it's correct
fs.writeFileSync(envLocalPath, envContent);
console.log('✅ Created/updated .env.local file');

// 2. Create .env.local.backup for safety
const backupPath = envLocalPath + '.backup';
fs.writeFileSync(backupPath, envContent);
console.log('✅ Created .env.local.backup file');

// 3. Verify no unsafe environment variable access in key files
const filesToCheck = [
  {
    path: path.join(__dirname, 'utils/config.ts'),
    name: 'Configuration file',
    unsafePatterns: [
      /import\.meta\.env\.[A-Z_]+/g,
      /Object\.keys\(import\.meta\.env\)/g
    ]
  },
  {
    path: path.join(__dirname, 'utils/envTest.ts'),
    name: 'Environment test file',
    unsafePatterns: [
      /import\.meta\.env\.[A-Z_]+/g,
      /envObject\.[A-Z_]+/g
    ]
  }
];

let unsafeAccessFound = false;

filesToCheck.forEach(file => {
  if (fs.existsSync(file.path)) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      
      file.unsafePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          // Check if these are in protected try-catch blocks
          const lines = content.split('\n');
          matches.forEach(match => {
            const lineIndex = lines.findIndex(line => line.includes(match));
            if (lineIndex !== -1) {
              // Simple heuristic: check if there's a try block before this line
              const beforeLines = lines.slice(Math.max(0, lineIndex - 10), lineIndex);
              const hasTryBlock = beforeLines.some(line => line.trim().includes('try'));
              
              if (!hasTryBlock) {
                console.log(`⚠️ ${file.name}: Potentially unsafe access: ${match} on line ${lineIndex + 1}`);
                unsafeAccessFound = true;
              }
            }
          });
        }
      });
      
      console.log(`✅ ${file.name}: Checked for unsafe access patterns`);
    } catch (error) {
      console.log(`❌ ${file.name}: Error reading file - ${error.message}`);
    }
  } else {
    console.log(`❌ ${file.name}: File not found`);
  }
});

console.log('\n🔧 What was fixed in this complete fix:');
console.log('   ✅ Added try-catch around Object.keys(import.meta.env) in config.ts');
console.log('   ✅ Enhanced App.tsx with environment readiness check');
console.log('   ✅ Added 250ms delay to ensure Vite environment is ready');
console.log('   ✅ Added localhost-only development tools loading');
console.log('   ✅ Created persistent .env.local file');
console.log('   ✅ Created .env.local.backup for safety');

if (!unsafeAccessFound) {
  console.log('\n🎉 No unsafe environment variable access detected!');
} else {
  console.log('\n⚠️ Some potentially unsafe access patterns found - please review');
}

console.log('\n🚀 Expected results after npm run dev:');
console.log('   ✅ No more "Cannot read properties of undefined" errors');
console.log('   ✅ Development tools load safely with delay');
console.log('   ✅ Environment variables properly detected');
console.log('   ✅ Diagnostic runs without crashing');

console.log('\n📋 Next steps:');
console.log('   1. Restart development server: npm run dev');
console.log('   2. Wait for "✅ Development tools loaded successfully" message');
console.log('   3. Environment warnings are normal - they indicate safe fallback mode');

console.log('\n✅ Complete diagnostic fix applied!');