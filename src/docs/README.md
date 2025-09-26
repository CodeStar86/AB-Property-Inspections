# AB Property Inspection Services

A comprehensive Property Inspections Management App that manages the complete workflow from property registration through inspection completion and financial settlement.

## 🏢 Overview

The app handles three distinct user roles (Agents, Clerks, Admins) with fully automated financial calculations including 15% cashback for agents and 30% commission for clerks. It focuses on London properties with bedroom-based pricing and requires a mobile-first responsive design.

## 🚀 Key Features

- **Role-based Authentication**: Agents, Clerks, and Admin users
- **Property Management**: Registration and management of London properties
- **Inspection Workflow**: Complete booking to completion process
- **Financial Automation**: Automated cashback and commission calculations
- **Invoice Generation**: Automated 2-week billing cycles
- **OpenAI Integration**: Automatic room condition analysis
- **Mobile-first Design**: Responsive across all devices
- **Security Focus**: Comprehensive security validation and monitoring

## 🛠 Technology Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN UI
- **Backend**: Supabase (Database + Authentication)
- **AI Integration**: OpenAI API
- **Build Tool**: Vite

## 📋 Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see ENV_SETUP_GUIDE.md)
4. Run development server: `npm run dev`

## 📚 Documentation

- [Environment Setup Guide](./ENV_SETUP_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Development Guidelines](../guidelines/Guidelines.md)

## 🏗 Architecture

The app follows a modular architecture with clear separation of concerns:

```
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Role-specific dashboards
│   ├── common/          # Shared components
│   └── ui/              # ShadCN UI components
├── context/             # React context providers
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── styles/              # Global CSS and themes
```

## 🔐 Security

The app implements comprehensive security measures:

- Environment variable validation
- Secure file uploads
- Rate limiting
- Input sanitization
- HTTPS enforcement in production
- Cookie consent management

## 🎨 Design System

Built with a gradient purple color scheme throughout the application, providing a cohesive and professional appearance.

## 📱 Mobile Support

Optimized for mobile devices with:

- Touch-friendly interface elements
- Responsive layouts
- iOS keyboard optimization
- Print-friendly inspection reports

## 🧪 Development

Run the cleanup script to maintain clean code:
```bash
node scripts/cleanup.js
```

This removes temporary files and maintains project organization.

## 📄 License

Private project for AB Property Inspection Services.