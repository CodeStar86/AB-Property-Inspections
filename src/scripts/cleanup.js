#!/usr/bin/env node

/**
 * Cleanup script to remove temporary, test, and duplicate files
 * Run this to clean up the project structure
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
  
  // Duplicate files
  'components/clerk/ClerkManagement_fixed.tsx',
  
  // Old supabase functions (keeping make-server-7c025e45)
  'supabase/functions/server',
  
  // Setup scripts that are no longer needed
  'fix-setup.sh',
  'deploy-to-supabase.sh'
];

const directoriesToRemove = [
  'supabase/functions/server'
];

async function cleanup() {
  console.log('🧹 Starting cleanup...');
  
  let removedCount = 0;
  
  // Remove files
  for (const filePath of filesToRemove) {
    try {
      const fullPath = path.resolve(filePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      console.log(`✅ Removed: ${filePath}`);
      removedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`⚠️  Could not remove ${filePath}: ${error.message}`);
      }
    }
  }
  
  // Remove directories
  for (const dirPath of directoriesToRemove) {
    try {
      const fullPath = path.resolve(dirPath);
      await fs.access(fullPath);
      await fs.rmdir(fullPath, { recursive: true });
      console.log(`✅ Removed directory: ${dirPath}`);
      removedCount++;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`⚠️  Could not remove directory ${dirPath}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n🎉 Cleanup complete! Removed ${removedCount} items.`);
  console.log('📁 Project structure is now cleaner and more maintainable.');
}

cleanup().catch(console.error);