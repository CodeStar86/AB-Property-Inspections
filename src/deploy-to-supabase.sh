#!/bin/bash

# AB Property Inspection Services - Supabase Deployment Script
# This script deploys your Edge Function to Supabase production

echo "🚀 AB Property Inspection Services - Supabase Deployment"
echo "========================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "📋 Please follow these steps:"
echo ""
echo "1. Login to Supabase:"
echo "   supabase login"
echo ""
echo "2. Get your project reference ID from https://supabase.com/dashboard/projects"
echo "   (It looks like: wlxmcgoxsepwbnfdgxvq)"
echo ""
echo "3. Link your project (replace YOUR_PROJECT_ID):"
echo "   supabase link --project-ref YOUR_PROJECT_ID"
echo ""
echo "4. Deploy the Edge Function:"
echo "   supabase functions deploy make-server-7c025e45 --project-ref YOUR_PROJECT_ID"
echo ""
echo "5. Set environment variables in Supabase Dashboard:"
echo "   - Go to Project Settings → Environment Variables"
echo "   - Add these variables:"
echo "     SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co"
echo "     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
echo "     ADMIN_EMAIL=r.depala86@gmail.com"
echo "     ADMIN_PASSWORD=Bharti1956!"
echo "     ADMIN_NAME=System Administrator"
echo ""
echo "📝 Note: Your function name must be 'make-server-7c025e45' to match your API client configuration"
echo ""

# Create the function directory structure that Supabase expects
echo "🔧 Setting up Supabase function structure..."

# Create the correct directory structure
mkdir -p supabase/functions/make-server-7c025e45

# Copy your server files to the new function directory
cp supabase/functions/server/index.tsx supabase/functions/make-server-7c025e45/index.ts
cp supabase/functions/server/kv_store.tsx supabase/functions/make-server-7c025e45/kv_store.ts
cp supabase/functions/server/rateLimiter.tsx supabase/functions/make-server-7c025e45/rateLimiter.ts

echo "✅ Function structure created at supabase/functions/make-server-7c025e45/"
echo ""
echo "🚀 Ready for deployment! Run the commands above to deploy."