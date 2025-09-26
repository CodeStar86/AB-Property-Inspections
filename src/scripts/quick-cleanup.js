const fs = require('fs');
const path = require('path');

// Files to remove
const filesToRemove = [
  'components/clerk/ClerkManagement_fixed.tsx',
  'check-env-now.js',
  'complete-diagnostic-fix.js',
  'debug-env.js',
  'diagnostic-fix.js',
  'final-env-fix.js',
  'final-syntax-fix.js',
  'fix-env.js',
  'simple-env-fix.js',
  'syntax-fix-verification.js',
  'test-config-fix.js',
  'test-config.js',
  'test-env.tsx',
  'test-imports.tsx',
  'verify-security.js',
  'fix-setup.sh',
  'deploy-to-supabase.sh'
];

// Directories to remove
const directoriesToRemove = [
  'supabase/functions/server'
];

// Documentation files to move to docs/
const docsToMove = [
  { from: 'DEPLOYMENT_GUIDE.md', to: 'docs/DEPLOYMENT_GUIDE_BACKUP.md' },
  { from: 'ENV_SETUP_GUIDE.md', to: 'docs/ENV_SETUP_GUIDE_BACKUP.md' },
  { from: 'PRODUCTION_CHECKLIST.md', to: 'docs/PRODUCTION_CHECKLIST_BACKUP.md' },
  { from: 'SECURITY_GUIDE.md', to: 'docs/SECURITY_GUIDE_BACKUP.md' },
  { from: 'PRODUCTION_DEPLOYMENT.md', to: 'docs/PRODUCTION_DEPLOYMENT.md' },
  { from: 'SUPABASE_DEPLOYMENT_STEPS.md', to: 'docs/SUPABASE_DEPLOYMENT_STEPS.md' },
  { from: 'GITHUB_SETUP.md', to: 'docs/GITHUB_SETUP.md' },
  { from: 'SIMPLE_PROTECTION_GUIDE.md', to: 'docs/SIMPLE_PROTECTION_GUIDE.md' },
  { from: 'VERSION_LOCK.md', to: 'docs/VERSION_LOCK.md' },
  { from: 'Attributions.md', to: 'docs/Attributions.md' }
];

function quickCleanup() {
  console.log('🧹 Starting quick cleanup...\n');
  
  let removedCount = 0;
  let movedCount = 0;
  
  // Remove files
  console.log('🗑️  Removing temporary files...');
  filesToRemove.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   ✅ Removed: ${filePath}`);
        removedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not remove ${filePath}: ${error.message}`);
    }
  });
  
  // Remove directories
  console.log('\n📁 Removing duplicate directories...');
  directoriesToRemove.forEach(dirPath => {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`   ✅ Removed directory: ${dirPath}`);
        removedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not remove directory ${dirPath}: ${error.message}`);
    }
  });
  
  // Move documentation files
  console.log('\n📚 Moving documentation files...');
  docsToMove.forEach(({ from, to }) => {
    try {
      if (fs.existsSync(from) && !fs.existsSync(to)) {
        const content = fs.readFileSync(from, 'utf8');
        fs.writeFileSync(to, content);
        fs.unlinkSync(from);
        console.log(`   ✅ Moved: ${from} → ${to}`);
        movedCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  Could not move ${from}: ${error.message}`);
    }
  });
  
  console.log(`\n🎉 Quick cleanup complete!`);
  console.log(`   📂 ${removedCount} items removed`);
  console.log(`   📚 ${movedCount} documentation files organized`);
  console.log(`\n✨ Project structure is now cleaner!`);
}

quickCleanup();