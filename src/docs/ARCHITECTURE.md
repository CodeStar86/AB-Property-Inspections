# 🏗️ Architecture Overview
## AB Property Inspection Services

## 📁 Project Structure

```
AB Property Inspection Services/
├── 📱 App.tsx                    # Main application entry point
├── 📄 package.json              # Dependencies and scripts
├── ⚙️  vite.config.ts            # Vite configuration
├── 🔧 tsconfig.json             # TypeScript configuration
├── 📝 README.md                 # Project overview
│
├── 🧩 components/               # React components
│   ├── auth/                    # Authentication components
│   │   ├── AuthViews.tsx        # Auth view router
│   │   ├── LoginForm.tsx        # Login form
│   │   ├── RegisterForm.tsx     # Registration form
│   │   └── ForgotPasswordForm.tsx # Password reset
│   │
│   ├── dashboard/               # Role-specific dashboards
│   │   ├── AgentDashboard.tsx   # Agent interface
│   │   ├── ClerkDashboard.tsx   # Clerk interface
│   │   └── AdminDashboard.tsx   # Admin interface
│   │
│   ├── common/                  # Shared components
│   │   ├── AppInitializer.tsx   # App initialization
│   │   ├── SecurityAlerts.tsx   # Security notifications
│   │   ├── CookieManager.tsx    # Cookie consent
│   │   ├── PeriodOverview.tsx   # Billing period display
│   │   └── RealTimePeriodDisplay.tsx # Live period tracking
│   │
│   ├── inspection/              # Inspection workflow
│   │   ├── InspectionBookingForm.tsx # Booking interface
│   │   ├── InspectionCompletionForm.tsx # Completion form
│   │   ├── InspectionReport.tsx # Report generation
│   │   └── PhotoGallery.tsx     # Photo management
│   │
│   ├── property/                # Property management
│   │   ├── PropertyRegistrationForm.tsx # Property registration
│   │   └── PropertySelectionDialog.tsx # Property selection
│   │
│   ├── security/                # Security components
│   │   ├── SecurityValidator.tsx # Security monitoring
│   │   ├── SecurityDashboard.tsx # Security overview
│   │   ├── SecureFileUpload.tsx # Secure uploads
│   │   └── SecureInput.tsx      # Input sanitization
│   │
│   ├── invoice/                 # Invoice management
│   │   ├── InvoiceManagement.tsx # Invoice list/management
│   │   └── InvoiceDetail.tsx    # Invoice details
│   │
│   ├── agent/                   # Agent management
│   │   ├── AgentManagement.tsx  # Agent administration
│   │   └── AgentDetailDialog.tsx # Agent details
│   │
│   ├── clerk/                   # Clerk management
│   │   ├── ClerkManagement.tsx  # Clerk administration
│   │   └── ClerkDetailDialog.tsx # Clerk details
│   │
│   ├── cashback/                # Cashback system
│   │   └── CashbackManagement.tsx # Cashback tracking
│   │
│   ├── pricing/                 # Pricing management
│   │   └── PricingManagement.tsx # Pricing configuration
│   │
│   ├── privacy/                 # Privacy components
│   │   ├── CookieConsent.tsx    # Cookie consent UI
│   │   ├── DataProtectionPolicy.tsx # Data protection
│   │   └── PrivacySettings.tsx  # Privacy settings
│   │
│   ├── layout/                  # Layout components
│   │   └── Header.tsx           # Application header
│   │
│   └── ui/                      # ShadCN UI components
│       ├── button.tsx           # Button component
│       ├── card.tsx             # Card component
│       ├── dialog.tsx           # Dialog component
│       └── ...                  # Other UI components
│
├── 🧠 context/                  # React Context
│   └── AppContext.tsx           # Global state management
│
├── 🔧 utils/                    # Utility functions
│   ├── api.tsx                  # API client
│   ├── config.ts                # Configuration management
│   ├── security.ts              # Security utilities
│   ├── billingPeriods.ts        # Billing calculations
│   ├── cashbackProcessing.ts    # Cashback logic
│   ├── invoiceGeneration.ts     # Invoice creation
│   ├── openaiService.ts         # OpenAI integration
│   ├── cookieUtils.ts           # Cookie management
│   ├── environmentChecker.ts    # Environment validation
│   ├── startupManager.ts        # App initialization
│   └── supabase/                # Supabase utilities
│       └── info.tsx             # Supabase configuration
│
├── 🎨 styles/                   # Styling
│   └── globals.css              # Global styles (Tailwind v4)
│
├── 📊 types/                    # TypeScript definitions
│   └── index.ts                 # Type definitions
│
├── 🖥️  supabase/                # Backend functions
│   └── functions/
│       └── make-server-7c025e45/ # Production Edge Function
│           ├── index.ts         # Main function
│           ├── kv_store.ts      # Key-value storage
│           └── rateLimiter.ts   # Rate limiting
│
├── 📚 docs/                     # Documentation
│   ├── README.md                # Full documentation
│   ├── ENV_SETUP_GUIDE.md       # Environment setup
│   ├── DEPLOYMENT_GUIDE.md      # Deployment instructions
│   ├── SECURITY_GUIDE.md        # Security documentation
│   ├── PRODUCTION_CHECKLIST.md  # Production checklist
│   ├── ARCHITECTURE.md          # This file
│   └── CLEANUP_SUMMARY.md       # Cleanup documentation
│
├── 📜 scripts/                  # Build and utility scripts
│   ├── cleanup.js               # Quick cleanup
│   ├── final-cleanup.js         # Full cleanup
│   ├── remove-duplicates.js     # Remove duplicates
│   ├── validate-env.js          # Environment validation
│   └── setup-production.js      # Production setup
│
└── 📋 guidelines/               # Development guidelines
    └── Guidelines.md            # Coding standards
```

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **ShadCN UI** for components
- **Vite** for build tooling
- **Motion** for animations

### Backend
- **Supabase** for database and authentication
- **Edge Functions** for server-side logic
- **Row Level Security** for data protection

### External APIs
- **OpenAI API** for room condition analysis
- **Email Services** for invoice delivery

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code quality
- **Node.js** scripts for automation

## 🏛️ Architecture Patterns

### Component Architecture
- **Modular Design**: Each feature in its own component
- **Single Responsibility**: Components have one clear purpose
- **Reusability**: Shared components in common/ and ui/
- **Type Safety**: Full TypeScript coverage

### State Management
- **React Context**: Global state management
- **Local State**: Component-specific state
- **Derived State**: Computed values from context

### Security Architecture
- **Environment Variables**: Secure configuration
- **Row Level Security**: Database-level access control
- **Input Sanitization**: All user inputs validated
- **Rate Limiting**: API protection

### Data Flow
```
User Input → Components → Context → API Client → Supabase → Database
                    ↓
                Security Validation → Error Handling → User Feedback
```

## 🚀 Performance Optimizations

### Code Splitting
- Lazy loading of route components
- Dynamic imports for heavy utilities
- Modular component structure

### Bundle Optimization
- Tree shaking for unused code
- Optimized dependencies
- Compressed builds

### Runtime Performance
- Efficient React patterns
- Memoization where appropriate
- Optimized re-renders

## 🔒 Security Layers

### Application Security
- **Input Validation**: All user inputs sanitized
- **Authentication**: Secure token-based auth
- **Authorization**: Role-based access control
- **File Upload Security**: Type and size validation

### Infrastructure Security
- **HTTPS Enforcement**: Secure connections
- **Security Headers**: CSP, HSTS, etc.
- **Rate Limiting**: API abuse prevention
- **Environment Protection**: Secure configuration

### Data Security
- **Row Level Security**: Database access control
- **Encryption**: Data encrypted in transit and at rest
- **Audit Logging**: All actions logged
- **Backup Strategy**: Regular data backups

## 📱 Mobile-First Design

### Responsive Architecture
- **Mobile-first CSS**: Tailwind mobile-first approach
- **Touch Optimization**: 44px minimum touch targets
- **Performance**: Optimized for mobile devices
- **Accessibility**: Screen reader and keyboard support

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript
- **Enhanced Experience**: JavaScript adds interactivity
- **Offline Capability**: Service worker for offline access
- **PWA Features**: Installable web app

## 🔄 Development Workflow

### Code Quality
1. **TypeScript** ensures type safety
2. **ESLint** enforces code standards
3. **Component Testing** verifies functionality
4. **Security Validation** checks for vulnerabilities

### Deployment Process
1. **Environment Validation** checks configuration
2. **Build Optimization** creates production bundle
3. **Security Scanning** validates security status
4. **Production Deployment** deploys to platform

### Maintenance
1. **Regular Cleanup** removes temporary files
2. **Dependency Updates** keeps packages current
3. **Security Monitoring** watches for vulnerabilities
4. **Performance Monitoring** tracks app performance

This architecture provides a scalable, secure, and maintainable foundation for the AB Property Inspection Services application.