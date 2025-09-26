# 🚀 Deployment Guide

## Overview
This guide covers deploying your AB Property Inspection Services app to production.

## Prerequisites
- Supabase project set up
- Environment variables configured
- OpenAI API key (optional)

## Production Deployment Steps

### 1. Environment Variables
Set up your production environment variables:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ENVIRONMENT=production
```

### 2. Supabase Edge Function Deployment
Deploy the Edge Function to your Supabase project:

```bash
# Navigate to your project
cd supabase/functions/make-server-7c025e45

# Deploy to Supabase
supabase functions deploy make-server-7c025e45 --project-ref YOUR_PROJECT_REF
```

### 3. Set Supabase Secrets
Configure the necessary secrets in your Supabase dashboard:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key --project-ref YOUR_PROJECT_REF
```

### 4. Build and Deploy Frontend
Build your frontend application:

```bash
npm run build
```

Deploy the `dist` folder to your hosting platform of choice (Vercel, Netlify, etc.).

### 5. Verify Deployment
- Test all user roles (Agent, Clerk, Admin)
- Verify API connections
- Check security validator in admin dashboard
- Test inspection workflow end-to-end

## Production Checklist
- [ ] Environment variables set
- [ ] Edge Function deployed
- [ ] Secrets configured
- [ ] Frontend built and deployed
- [ ] SSL certificate active
- [ ] All features tested
- [ ] Security validator shows green

## Monitoring
- Check Supabase function logs for errors
- Monitor API usage and rate limits
- Review security validator regularly

For detailed deployment steps, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).