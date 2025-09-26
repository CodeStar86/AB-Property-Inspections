#!/usr/bin/env node

/**
 * Security Verification Script for AB Property Inspection Services
 * Checks that credentials are properly secured and not exposed
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 AB Property Inspection Services - Security Verification\n');

// Files to check for hardcoded credentials
const sensitiveFiles = [
  'App.tsx',
  'utils/supabase/info.tsx',
  'supabase/functions/server/index.tsx',
  'components/auth/LoginForm.tsx',
  'context/AppContext.tsx'
];

// Patterns that indicate hardcoded credentials
const securityPatterns = [
  { pattern: /r\.depala86@gmail\.com/g, description: 'Admin email' },
  { pattern: /Bharti1956!/g, description: 'Admin password' },
  { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, description: 'JWT token' },
  { pattern: /wlxmcgoxsepwbnfdgxvq/g, description: 'Project ID' }
];

let foundIssues = [];
let checkedFiles = 0;

console.log('📋 Checking files for hardcoded credentials...\n');

sensitiveFiles.forEach(fileName => {
  const filePath = path.join(__dirname, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    checkedFiles++;
    
    let fileIssues = [];
    
    securityPatterns.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        fileIssues.push({
          file: fileName,
          issue: description,
          count: matches.length,
          lines: content.split('\n').map((line, index) => 
            pattern.test(line) ? index + 1 : null
          ).filter(Boolean)
        });
      }
    });
    
    if (fileIssues.length > 0) {
      foundIssues.push(...fileIssues);
      console.log(`❌ ${fileName}: Found ${fileIssues.length} security issue(s)`);
      fileIssues.forEach(issue => {
        console.log(`   - ${issue.issue} on lines: ${issue.lines.join(', ')}`);
      });
    } else {
      console.log(`✅ ${fileName}: No hardcoded credentials found`);
    }
    
  } catch (error) {
    console.log(`❌ Error reading ${fileName}: ${error.message}`);
  }
});

console.log('\n📁 Checking required security files...\n');

// Check required security files
const requiredFiles = [
  { file: '.env.local', description: 'Environment variables file' },
  { file: '.env.example', description: 'Environment template' },
  { file: '.gitignore', description: 'Git ignore file' },
  { file: 'SECURITY_GUIDE.md', description: 'Security documentation' },
  { file: 'utils/config.ts', description: 'Secure configuration' }
];

let missingFiles = [];

requiredFiles.forEach(({ file, description }) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}: ${description} exists`);
  } else {
    console.log(`❌ ${file}: ${description} missing`);
    missingFiles.push(file);
  }
});

// Check .gitignore contains .env.local
console.log('\n🔍 Checking .gitignore protection...\n');

if (fs.existsSync(path.join(__dirname, '.gitignore'))) {
  const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
  const protectedPatterns = ['.env.local', '.env', '*.local'];
  
  protectedPatterns.forEach(pattern => {
    if (gitignore.includes(pattern)) {
      console.log(`✅ .gitignore protects: ${pattern}`);
    } else {
      console.log(`❌ .gitignore missing: ${pattern}`);
      foundIssues.push({ file: '.gitignore', issue: `Missing ${pattern} protection` });
    }
  });
} else {
  console.log('❌ .gitignore file not found');
}

// Final summary
console.log('\n' + '='.repeat(50));
console.log('📊 SECURITY VERIFICATION SUMMARY');
console.log('='.repeat(50));

console.log(`📁 Files checked: ${checkedFiles}`);
console.log(`🔍 Security issues found: ${foundIssues.length}`);
console.log(`📋 Missing required files: ${missingFiles.length}`);

if (foundIssues.length === 0 && missingFiles.length === 0) {
  console.log('\n🎉 EXCELLENT! Your app is properly secured!');
  console.log('✅ No hardcoded credentials found');
  console.log('✅ All security files present');
  console.log('✅ Git protection configured');
  console.log('\n🚀 Your app is ready for safe development and deployment!');
} else {
  console.log('\n⚠️  SECURITY ISSUES DETECTED:');
  
  if (foundIssues.length > 0) {
    console.log('\n🔒 Credential Issues:');
    foundIssues.forEach(issue => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
  }
  
  if (missingFiles.length > 0) {
    console.log('\n📁 Missing Files:');
    missingFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log('\n💡 Please review the SECURITY_GUIDE.md for setup instructions.');
}

console.log('\n🔗 Next steps:');
console.log('   1. Run: npm run dev');
console.log('   2. Check browser console for diagnostic information');
console.log('   3. Review SECURITY_GUIDE.md for details');
console.log('\n');