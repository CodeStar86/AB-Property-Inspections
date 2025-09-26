#!/usr/bin/env node

/**
 * Remove duplicate and temporary files
 */

import { promises as fs } from 'fs';

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
  'verify-security.js'
];

async function removeDuplicates() {
  console.log('🗑️  Removing duplicate and temporary files...\n');
  
  let removedCount = 0;
  
  for (const filePath of filesToRemove) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`✅ Removed: ${filePath}`);
      removedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`⚠️  Could not remove ${filePath}: ${error.message}`);
      }
    }
  }
  
  // Remove duplicate supabase/functions/server directory
  try {
    await fs.access('supabase/functions/server');
    await fs.rmdir('supabase/functions/server', { recursive: true });
    console.log(`✅ Removed directory: supabase/functions/server`);
    removedCount++;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.log(`⚠️  Could not remove directory: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Cleanup complete! Removed ${removedCount} items.`);
  console.log('📁 Project structure is now cleaner.');
}

removeDuplicates().catch(console.error);