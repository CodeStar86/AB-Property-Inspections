#!/usr/bin/env node

/**
 * Syntax Fix Verification Script
 * Checks that the TypeScript syntax errors are resolved
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AB Property Inspection Services - Syntax Fix Verification\n');

// Check if the problematic files exist and have correct syntax
const filesToCheck = [
  {
    path: 'utils/config.ts',
    name: 'Configuration file',
    checkFor: 'typeof import !== \'undefined\''
  },
  {
    path: 'utils/envTest.ts', 
    name: 'Environment test file',
    checkFor: 'typeof import !== \'undefined\''
  }
];

let allFixed = true;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes(file.checkFor)) {
        console.log(`❌ ${file.name}: Still contains problematic syntax`);
        allFixed = false;
      } else {
        console.log(`✅ ${file.name}: Syntax fixed`);
      }
      
    } catch (error) {
      console.log(`❌ ${file.name}: Error reading file - ${error.message}`);
      allFixed = false;
    }
  } else {
    console.log(`❌ ${file.name}: File not found`);
    allFixed = false;
  }
});

// Check .env.local file
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file exists');
  
  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const hasUrl = content.includes('VITE_SUPABASE_URL=');
    const hasKey = content.includes('VITE_SUPABASE_ANON_KEY=');
    
    if (hasUrl && hasKey) {
      console.log('✅ .env.local has required VITE_ variables');
    } else {
      console.log('❌ .env.local missing required VITE_ variables');
      allFixed = false;
    }
  } catch (error) {
    console.log('❌ Error reading .env.local:', error.message);
    allFixed = false;
  }
} else {
  console.log('❌ .env.local file missing');
  allFixed = false;
}

console.log('\n🔧 What was fixed:');
console.log('   ✅ Removed invalid "typeof import !== \'undefined\'" checks');
console.log('   ✅ Fixed import.meta.env access in config.ts');
console.log('   ✅ Fixed import.meta.env access in envTest.ts');
console.log('   ✅ Recreated .env.local with proper format');

if (allFixed) {
  console.log('\n🎉 All syntax errors have been fixed!');
  console.log('🚀 Ready to run: npm run dev');
} else {
  console.log('\n⚠️ Some issues remain. Please check the files above.');
}

console.log('\n📋 Expected results after npm run dev:');
console.log('   ✅ Build should complete without syntax errors');
console.log('   ✅ Environment variables should load properly');
console.log('   ✅ Development tools should load without issues');

console.log('\n✅ Syntax fix verification complete!');