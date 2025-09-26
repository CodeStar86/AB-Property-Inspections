# 🏢 AB Property Inspection Services

A comprehensive Property Inspections Management App for London properties with role-based authentication, automated financial calculations, and mobile-first design.

## 🔒 **SECURITY FIRST**
This application uses **secure environment variables** for all sensitive data. No credentials are hardcoded in the source code.

## 📚 Documentation
For detailed documentation, see the [docs/](./docs/) folder:
- [📖 Full Documentation](./docs/README.md)
- [🔧 Environment Setup Guide](./docs/ENV_SETUP_GUIDE.md)
- [🚀 Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [🔒 Security Guide](./docs/SECURITY_GUIDE.md)
- [✅ Production Checklist](./docs/PRODUCTION_CHECKLIST.md)

## 🧹 Project Maintenance

Keep your codebase clean with these commands:

```bash
# Remove duplicate and temporary files
npm run cleanup

# Full cleanup including documentation organization
npm run cleanup:full

# Validate environment configuration
npm run validate-env
```

## 🚀 Quick Start

### 1. **Environment Setup**
```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local with your actual credentials
# (Your actual .env.local is already set up)
```

### 2. **Install & Run**
```bash
npm install
npm run dev
```

### 3. **Admin Login**
- Admin credentials are securely stored in environment variables
- See `SECURITY_GUIDE.md` for full security documentation

## ✨ Features

### 🔐 **Role-Based Access Control**
- **Agents**: Property registration, inspection booking, earnings dashboard
- **Clerks**: Inspection management, completion forms, commission tracking  
- **Admin**: Full system management, user control, financial oversight

### 💰 **Automated Financial System**
- **15% cashback** for agents (resets every 2 weeks)
- **30% commission** for clerks (invoiced every 2 weeks)
- **PDF invoice generation** with email functionality
- **Real-time financial tracking** and reporting

### 🏠 **Property Management**
- **London-focused** property registration
- **Bedroom-based pricing** (Studio = 0 bedrooms)
- **Multiple inspection types**: Routine, Fire Safety, Check-in, Check-out
- **Photo documentation** with secure upload

### 📱 **Mobile-First Design**
- **Responsive layout** optimized for mobile devices
- **Touch-friendly interface** with 44px minimum touch targets
- **Purple gradient theme** throughout the application
- **iOS/Android optimization** with proper viewport handling

## 🛡️ Security Features

### **🔒 Comprehensive Security Protection**
- ✅ **Environment variable protection** for all sensitive data
- ✅ **Git security** - credentials never committed to version control  
- ✅ **API key validation** with format checking and security warnings
- ✅ **Runtime validation** of configuration with detailed security scoring
- ✅ **Secure context enforcement** (HTTPS) with development warnings
- ✅ **Credential masking** in logs and debugging output
- ✅ **Graceful fallbacks** when API keys are missing or invalid
- ✅ **Admin security dashboard** for monitoring configuration status
- ✅ **Automatic security checks** on app initialization
- ✅ **GitHub secret scanning protection** compliance

### **🤖 AI Service Security**
- ✅ **Safe API key handling** with comprehensive validation
- ✅ **Fallback responses** when OpenAI API is unavailable
- ✅ **No hardcoded credentials** in source code
- ✅ **Error handling** for invalid or expired API keys
- ✅ **Development warnings** for missing configuration

### **🔍 Security Monitoring**
- ✅ **Real-time security status** in admin dashboard
- ✅ **Environment validation** with actionable recommendations
- ✅ **Security score calculation** based on configuration quality
- ✅ **Development diagnostics** for troubleshooting security issues
- ✅ **Sensitive data masking** for safe logging and debugging

## 📁 Project Structure

```
├── components/          # React components organized by feature
│   ├── auth/           # Login, registration, forgot password
│   ├── dashboard/      # Role-specific dashboards
│   ├── property/       # Property registration and management
│   ├── inspection/     # Inspection booking, completion, reports
│   ├── invoice/        # PDF generation and email functionality
│   └── ui/            # ShadCN UI components
├── utils/              # Utilities and configuration
│   ├── config.ts       # Secure environment configuration
│   ├── devTools.ts     # Development and debugging tools
│   └── security.ts     # Security utilities
├── styles/             # Tailwind v4 global styles
└── types/              # TypeScript type definitions
```

## 🔧 Development

### **Environment Configuration**
- Uses Vite environment variables (`VITE_*`)
- Secure credential management
- Development diagnostics available in browser console

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Git Workflow**
```bash
# Your app is protected with version control
git add .
git commit -m "describe your changes"
git push origin main
```

## 📚 Documentation

- 📖 **[Security Guide](SECURITY_GUIDE.md)** - Credential management and security
- 🛠️ **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment
- 🔒 **[Version Lock Guide](VERSION_LOCK.md)** - Package management
- 🚀 **[Protection Guide](SIMPLE_PROTECTION_GUIDE.md)** - Daily operations

## 🎯 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + ShadCN UI
- **Backend**: Supabase + Edge Functions
- **Authentication**: Supabase Auth with JWT
- **File Storage**: Secure image upload system
- **PDF Generation**: jsPDF with professional templates
- **Icons**: Lucide React
- **State Management**: React Context + Reducers

## 🚨 Important Notes

- **Admin Access**: Securely configured via environment variables
- **Clerk Creation**: Only admins can create clerk accounts
- **Data Protection**: GDPR-compliant with cookie consent management
- **Mobile Optimization**: iOS zoom prevention and touch optimization
- **Print Support**: Optimized for inspection report printing

## 🔄 Version Control & Protection

Your app includes comprehensive protection against update breakdowns:
- Git repository with full backup capability
- Version-locked critical dependencies
- Emergency rollback procedures
- Safe update workflows

---

**🔒 Security Notice**: This application follows security best practices with environment-based configuration. All sensitive data is properly protected and never exposed in source code.