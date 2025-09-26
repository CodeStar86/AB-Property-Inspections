# 🔧 Environment Variables Setup Guide

## 📋 **Quick Setup**

Your AB Property Inspection Services app uses **fallback configuration** that allows it to work immediately, even without environment variables. However, for full functionality, you should configure your environment variables.

## 🛡️ **Security First**

✅ **Your app is designed to be secure by default:**
- No hardcoded API keys in the source code
- Automatic fallback to safe default configurations
- Environment variables are never committed to Git
- All sensitive data is properly masked in logs

## 📝 **Environment Variables**

Create a `.env` file in your project root with these variables:

```bash
# === REQUIRED FOR DATABASE FUNCTIONALITY ===
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# === OPTIONAL FOR AI FEATURES ===
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here

# === CONFIGURATION ===
VITE_APP_ENV=development
VITE_ENABLE_AI_ANALYSIS=true
```

## 🚀 **What Happens Without Environment Variables?**

**Your app will still work!** Here's what happens:

### ✅ **With Environment Variables:**
- Full database functionality with your Supabase project
- AI-powered room analysis for clerks
- Custom configuration settings

### ⚡ **Without Environment Variables:**
- App uses secure fallback Supabase configuration
- AI features show helpful messages instead of analysis
- All core functionality remains available
- No crashes or errors

## 🔑 **Getting Your API Keys**

### **Supabase Setup:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon key

### **OpenAI Setup (Optional):**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Copy the key (starts with `sk-`)

## 🛠️ **Development vs Production**

### **Development (.env):**
```bash
VITE_APP_ENV=development
VITE_ENABLE_DEV_TOOLS=true
```

### **Production:**
```bash
VITE_APP_ENV=production
VITE_ENABLE_DEV_TOOLS=false
```

## 🚨 **Important Notes**

1. **Never commit your .env file** - it's protected by .gitignore
2. **The app works without .env** - fallback configuration ensures functionality
3. **Environment variables are validated** - you'll get helpful warnings if something's wrong
4. **API keys are never logged** - all sensitive data is masked

## 🔍 **Troubleshooting**

### **App shows "using fallback configuration":**
- This is normal if you haven't set up environment variables yet
- The app will work fine, just add your .env file when ready

### **AI features not working:**
- Check that your OpenAI API key starts with `sk-`
- Ensure you have credits in your OpenAI account

### **Database connection issues:**
- Verify your Supabase URL is correct
- Check that your anon key is copied correctly

## ✅ **You're All Set!**

Your AB Property Inspection Services app is designed to be developer-friendly and secure. It will work immediately and guide you through any configuration needed!

For more help, check the security dashboard in the admin panel once you're logged in.