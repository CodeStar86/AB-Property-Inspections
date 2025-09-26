# 🚀 AB Property Inspection Services - Supabase Production Deployment

## Overview
Your AB Property Inspection Services app is production-ready! This guide will help you deploy the Edge Function to Supabase and complete the production setup.

## ✅ Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project or use existing one
3. **Project Reference ID**: Get this from your Supabase dashboard URL
   - Example: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`

## 🛠️ Step-by-Step Deployment

### **Step 1: Install Supabase CLI**

```bash
# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version
```

### **Step 2: Login to Supabase**

```bash
# Login to your Supabase account
supabase login
```

This will open a browser window for authentication.

### **Step 3: Link Your Project**

```bash
# Replace YOUR_PROJECT_ID with your actual project reference ID
supabase link --project-ref YOUR_PROJECT_ID
```

**To find your Project ID:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
4. Copy the project ID after `/project/`

### **Step 4: Create Database Table**

The app uses a KV store table. Create it in your Supabase dashboard:

1. Go to **Database** → **SQL Editor**
2. Run this SQL:

```sql
CREATE TABLE kv_store_7c025e45 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Add RLS (Row Level Security) - optional but recommended
ALTER TABLE kv_store_7c025e45 ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Enable all access for service role" ON kv_store_7c025e45
FOR ALL USING (auth.role() = 'service_role');
```

### **Step 5: Deploy the Edge Function**

The function structure is already prepared for you. Deploy it:

```bash
# Deploy the Edge Function
supabase functions deploy make-server-7c025e45 --project-ref YOUR_PROJECT_ID
```

### **Step 6: Set Environment Variables**

1. Go to **Project Settings** → **Environment Variables** in your Supabase dashboard
2. Add these variables:

```bash
# Required Environment Variables
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAIL=r.depala86@gmail.com
ADMIN_PASSWORD=Bharti1956!
ADMIN_NAME=System Administrator
```

**To get your Service Role Key:**
1. Go to **Project Settings** → **API**
2. Copy the `service_role` key (not the `anon` key)
3. ⚠️ **Keep this secret!** Never expose it in client code

### **Step 7: Test Your Deployment**

1. **Health Check**:
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-7c025e45/health
   ```

2. **Expected Response**:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-27T...",
     "service": "AB Property Inspection Services API"
   }
   ```

### **Step 8: Update Frontend Configuration**

Your frontend already points to the correct endpoint. Just verify in `/utils/api.tsx`:

```typescript
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7c025e45`;
```

Make sure `projectId` matches your actual Supabase project ID.

## 🎯 Verification Checklist

- [ ] Supabase CLI installed and working
- [ ] Successfully logged into Supabase
- [ ] Project linked correctly
- [ ] KV store table created
- [ ] Edge Function deployed without errors
- [ ] Environment variables set in dashboard
- [ ] Health check endpoint responds correctly
- [ ] Admin user can log in to your app

## 🚀 Launch Your App

Once all steps are complete:

1. **Deploy your frontend** to your preferred platform (Vercel, Netlify, etc.)
2. **Test the admin login** with:
   - Email: `r.depala86@gmail.com`
   - Password: `Bharti1956!`
3. **Create test agents and clerks** through the admin dashboard
4. **Test the complete workflow**: Property → Inspection → Invoice

## 🛟 Troubleshooting

### **Common Issues:**

1. **Function deployment fails**:
   ```bash
   # Check your project ID is correct
   supabase projects list
   ```

2. **Environment variables not working**:
   - Check they're set in the correct project
   - Restart the function after setting variables
   - Verify no typos in variable names

3. **Admin user not created**:
   - Check the function logs in Supabase dashboard
   - Verify environment variables are set correctly
   - Check the Edge Function logs for errors

4. **Database connection issues**:
   - Verify the KV store table exists
   - Check RLS policies are correct
   - Ensure service role key is valid

### **Check Function Logs:**
1. Go to **Edge Functions** in Supabase dashboard
2. Click on your function
3. View the **Logs** tab for error messages

## 🎉 Production Ready!

Your AB Property Inspection Services app is now fully deployed and production-ready with:

- ✅ Secure authentication system
- ✅ Role-based access control (Agent/Clerk/Admin)
- ✅ Complete property inspection workflow
- ✅ Automated financial calculations
- ✅ Invoice generation and management
- ✅ AI-powered room analysis (when OpenAI API key added)
- ✅ Mobile-responsive design
- ✅ Production security measures

## 📞 Support

If you encounter issues:

1. Check the function logs in Supabase dashboard
2. Verify all environment variables are set correctly
3. Test the health endpoint first
4. Check your network connection and firewall settings

Your app is now ready to handle real property inspections! 🏠✨