# 🔧 Environment Variables Setup Guide

## 📋 **Quick Setup**

Your AB Property Inspection Services app uses **fallback configuration** that allows it to work immediately, even without environment variables. However, for full functionality, you should configure your environment variables.

## 🔄 **Fallback System**

The app includes a sophisticated fallback system that ensures it works out of the box:

- **Database**: Uses demo Supabase instance with read-only access
- **Authentication**: Demo users available for testing all roles  
- **OpenAI**: AI features gracefully disabled if not configured
- **Security**: Comprehensive validation with helpful warnings

## 🌟 **Production Setup**

For production deployment, create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional)
VITE_OPENAI_API_KEY=your_openai_api_key

# Environment
VITE_ENVIRONMENT=production
```

## 🔐 **Getting Your Credentials**

### Supabase Setup
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon/public key

### OpenAI Setup (Optional)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add it to your environment variables

## ✅ **Validation**

The app automatically validates your environment setup and provides helpful feedback in the admin dashboard.

Run the validation script:
```bash
npm run validate-env
```

## 🔒 **Security Notes**

- Never commit `.env` files to version control
- Use environment variables in production
- The app gracefully handles missing configuration
- Security validator provides real-time feedback

## 🆘 **Troubleshooting**

If you encounter issues:

1. **Check the Security Dashboard** (Admin role) for detailed diagnostics
2. **Review browser console** for helpful error messages  
3. **Verify environment variables** are properly formatted
4. **Ensure network connectivity** to external services

The app is designed to be forgiving and provide clear guidance when issues occur.