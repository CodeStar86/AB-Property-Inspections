#!/usr/bin/env node

/**
 * Final cleanup script for AB Property Inspection Services
 * Removes temporary files and organizes documentation
 */

import { promises as fs } from 'fs';
import path from 'path';

const filesToRemove = [
  // Test and diagnostic files
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
  
  // Setup scripts no longer needed
  'fix-setup.sh',
  'deploy-to-supabase.sh',
  
  // Duplicate component
  'components/clerk/ClerkManagement_fixed.tsx'
];

const directoriesToRemove = [
  'supabase/functions/server'
];

const filesToMove = [
  { from: 'PRODUCTION_CHECKLIST.md', to: 'docs/PRODUCTION_CHECKLIST.md' },
  { from: 'SECURITY_GUIDE.md', to: 'docs/SECURITY_GUIDE.md' },
  { from: 'PRODUCTION_DEPLOYMENT.md', to: 'docs/PRODUCTION_DEPLOYMENT.md' },
  { from: 'SUPABASE_DEPLOYMENT_STEPS.md', to: 'docs/SUPABASE_DEPLOYMENT_STEPS.md' },
  { from: 'GITHUB_SETUP.md', to: 'docs/GITHUB_SETUP.md' },
  { from: 'SIMPLE_PROTECTION_GUIDE.md', to: 'docs/SIMPLE_PROTECTION_GUIDE.md' },
  { from: 'VERSION_LOCK.md', to: 'docs/VERSION_LOCK.md' },
  { from: 'Attributions.md', to: 'docs/Attributions.md' }
];

async function cleanup() {
  console.log('🧹 Starting final cleanup...\n');
  
  let removedCount = 0;
  let movedCount = 0;
  
  // Create docs directory if it doesn't exist
  try {
    await fs.mkdir('docs', { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  // Remove unnecessary files
  console.log('🗑️  Removing temporary files...');
  for (const filePath of filesToRemove) {
    try {
      const fullPath = path.resolve(filePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      console.log(`   ✅ Removed: ${filePath}`);
      removedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`   ⚠️  Could not remove ${filePath}: ${error.message}`);
      }
    }
  }
  
  // Remove unnecessary directories
  console.log('\n📁 Removing duplicate directories...');
  for (const dirPath of directoriesToRemove) {
    try {
      const fullPath = path.resolve(dirPath);
      await fs.access(fullPath);
      await fs.rmdir(fullPath, { recursive: true });
      console.log(`   ✅ Removed directory: ${dirPath}`);
      removedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`   ⚠️  Could not remove directory ${dirPath}: ${error.message}`);
      }
    }
  }
  
  // Move documentation files
  console.log('\n📚 Moving documentation files...');
  for (const move of filesToMove) {
    try {
      await fs.access(move.from);
      const content = await fs.readFile(move.from, 'utf8');
      await fs.writeFile(move.to, content);
      await fs.unlink(move.from);
      console.log(`   ✅ Moved: ${move.from} → ${move.to}`);
      movedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`   ⚠️  Could not move ${move.from}: ${error.message}`);
      }
    }
  }
  
  // Update ENV_SETUP_GUIDE.md to remove from root
  try {
    await fs.access('ENV_SETUP_GUIDE.md');
    await fs.unlink('ENV_SETUP_GUIDE.md');
    console.log(`   ✅ Removed: ENV_SETUP_GUIDE.md (already in docs/)`);
    removedCount++;
  } catch (error) {
    // File might not exist
  }
  
  // Update DEPLOYMENT_GUIDE.md to remove from root
  try {
    await fs.access('DEPLOYMENT_GUIDE.md');
    await fs.unlink('DEPLOYMENT_GUIDE.md');
    console.log(`   ✅ Removed: DEPLOYMENT_GUIDE.md (already in docs/)`);
    removedCount++;
  } catch (error) {
    // File might not exist
  }
  
  console.log(`\n🎉 Final cleanup complete!`);
  console.log(`   📂 ${removedCount} items removed`);
  console.log(`   📚 ${movedCount} documentation files organized`);
  console.log(`\n✨ Project structure is now clean and production-ready!`);
  
  // Show final project structure summary
  console.log(`\n📋 Clean project structure:`);
  console.log(`   ├── components/          # All UI components`);
  console.log(`   ├── context/             # React context`);
  console.log(`   ├── docs/                # All documentation`);
  console.log(`   ├── scripts/             # Build and utility scripts`);
  console.log(`   ├── styles/              # Global CSS`);
  console.log(`   ├── supabase/functions/  # Edge Functions`);
  console.log(`   ├── types/               # TypeScript definitions`);
  console.log(`   ├── utils/               # Utility functions`);
  console.log(`   └── App.tsx              # Main application`);
}

cleanup().catch(console.error);