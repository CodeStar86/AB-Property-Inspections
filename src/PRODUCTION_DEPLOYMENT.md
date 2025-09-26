# 🚀 Production Deployment Guide
## AB Property Inspection Services

This guide covers deploying your Property Inspection Management App to production with proper environment configuration.

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Production Supabase project created
- [ ] OpenAI API key configured (with billing limits)
- [ ] Domain name configured
- [ ] SSL certificate ready
- [ ] Environment variables configured on deployment platform

### ✅ Security Verification
- [ ] No hardcoded API keys in source code
- [ ] `.env` files not committed to Git
- [ ] Production environment variables set correctly
- [ ] Security headers enabled
- [ ] Rate limiting configured

## 🔐 Environment Variables Setup

### Required Variables
```bash
# Core Application
VITE_APP_ENV=production
VITE_ENABLE_DEV_TOOLS=false

# Supabase (Required)
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key_here

# OpenAI API (Optional - for AI features)
VITE_OPENAI_API_KEY=sk-proj-your_production_key_here
```

### Optional Enhancement Variables
```bash
# Security
VITE_ENABLE_SECURITY_HEADERS=true
VITE_RATE_LIMIT_ENABLED=true
VITE_RATE_LIMIT_REQUESTS_PER_MINUTE=30

# Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# PWA
VITE_ENABLE_PWA=true
VITE_APP_NAME="AB Property Inspection Services"

# URLs
VITE_BASE_URL=https://your-domain.com
VITE_API_BASE_URL=https://api.your-domain.com
```

## 🌐 Deployment Platforms

### Vercel Deployment

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables from `.env.production`

3. **Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

### Netlify Deployment

1. **Deploy from Git**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all production variables

### Railway Deployment

1. **Connect Repository**
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway up
   ```

2. **Configure Variables**
   - Add variables through Railway dashboard
   - Or use CLI: `railway variables set VITE_SUPABASE_URL=your_url`

### Digital Ocean App Platform

1. **Create App**
   - Connect GitHub repository
   - Configure build settings

2. **Environment Variables**
   - Add through App Platform console
   - Set as encrypted for sensitive values

## 🔧 Build Configuration

### Vite Production Build
Your `vite.config.ts` should include:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['./src/components/ui'],
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})
```

## 🛡️ Security Best Practices

### 1. Environment Variable Security
- Never hardcode API keys
- Use deployment platform's secret management
- Rotate keys regularly
- Set billing limits on OpenAI API

### 2. Supabase Production Setup
```sql
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### 3. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://api.openai.com;
               img-src 'self' data: https:;
               style-src 'self' 'unsafe-inline';">
```

## 📊 Monitoring Setup

### Error Tracking with Sentry
```bash
npm install @sentry/react @sentry/tracing
```

### Performance Monitoring
- Set up Lighthouse CI for performance tracking
- Monitor Core Web Vitals
- Track API response times

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build for production
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚀 Go-Live Checklist

### Final Verification
- [ ] App loads without errors in production
- [ ] Authentication works correctly
- [ ] Database operations function properly
- [ ] AI features work (if configured)
- [ ] Email notifications send correctly
- [ ] Mobile responsiveness verified
- [ ] Performance meets requirements (< 3s load time)

### Post-Launch Monitoring
- [ ] Set up error alerts
- [ ] Monitor API usage and costs
- [ ] Track user analytics
- [ ] Regular security scans
- [ ] Backup verification

## 🆘 Troubleshooting

### Common Issues

**Build Fails with Environment Variables**
```bash
# Check environment variables are set
echo $VITE_SUPABASE_URL
# Should output your URL, not undefined
```

**App Shows Fallback Configuration**
- Verify environment variables are set correctly
- Check variable names match exactly (case-sensitive)
- Ensure variables start with `VITE_`

**OpenAI Features Not Working**
- Verify API key starts with `sk-proj-` or `sk-`
- Check API key has sufficient credits
- Verify billing is set up on OpenAI account

**Database Connection Issues**
- Verify Supabase URL and key are correct
- Check Supabase project is not paused
- Verify database tables exist

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review error logs in your deployment platform
3. Verify environment variables are set correctly
4. Check the Security Dashboard in the admin panel

## 🎉 Success!

Once deployed, your AB Property Inspection Services app will be:
- ✅ Fully functional with all features
- 🔐 Secure with proper environment variable handling
- 📱 Mobile-responsive and PWA-ready
- 🚀 Production-optimized for performance
- 📊 Monitored for errors and performance