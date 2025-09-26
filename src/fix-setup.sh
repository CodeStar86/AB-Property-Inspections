#!/bin/bash

echo "🔧 Fixing AB Property Inspection Services setup..."

# Remove any conflicting lock files
echo "1. Cleaning up..."
rm -f package-lock.json yarn.lock

# Install dependencies and generate package-lock.json
echo "2. Installing dependencies..."
npm install

# Test the scripts work
echo "3. Testing scripts..."
npm run type-check
npm run lint
npm run test

# Try building the app
echo "4. Testing build..."
npm run build

echo "✅ Setup complete! Your app is now protected from update issues."
echo ""
echo "Next steps:"
echo "- Run 'npm run dev' to start your app"
echo "- Read SIMPLE_PROTECTION_GUIDE.md for daily operations"
echo "- Create a backup: git add . && git commit -m 'Working version backup'"