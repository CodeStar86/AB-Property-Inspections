const fs = require('fs');

console.log('🧹 Cleaning up project...\n');

// Remove the duplicate file
try {
  if (fs.existsSync('components/clerk/ClerkManagement_fixed.tsx')) {
    fs.unlinkSync('components/clerk/ClerkManagement_fixed.tsx');
    console.log('✅ Removed: components/clerk/ClerkManagement_fixed.tsx');
  }
} catch (error) {
  console.log('⚠️  Could not remove ClerkManagement_fixed.tsx:', error.message);
}

// Remove some key temporary files
const tempFiles = [
  'check-env-now.js',
  'debug-env.js',
  'test-config.js',
  'verify-security.js'
];

let removedCount = 1;

tempFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
      removedCount++;
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${file}`);
  }
});

console.log(`\n🎉 Cleanup complete! Removed ${removedCount} files.`);
console.log('📁 Your project is now cleaner and more organized.');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Test all functionality');
console.log('3. Deploy to production');
console.log('\n📚 See docs/ folder for complete documentation.');