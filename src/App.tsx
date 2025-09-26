import React, { useState } from 'react';
import { AppProvider, useAuth } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AgentDashboard } from './components/dashboard/AgentDashboard';
import { ClerkDashboard } from './components/dashboard/ClerkDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { SecurityValidator } from './components/security/SecurityValidator';
import { AuthViews } from './components/auth/AuthViews';
import { AppInitializer } from './components/common/AppInitializer';
import { SecurityAlerts } from './components/common/SecurityAlerts';
import { CookieManager } from './components/common/CookieManager';
import { Toaster } from './components/ui/sonner';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const [securityValidated, setSecurityValidated] = useState<boolean | null>(null);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-auto">
        {/* Admin Security Validator */}
        {isAdmin && (
          <div className="container mx-auto px-4 py-6">
            <SecurityValidator 
              onSecurityValidated={setSecurityValidated}
              showDetails={showSecurityDetails}
            />
          </div>
        )}

        {/* Security Alerts */}
        <SecurityAlerts 
          userRole={user.role}
          securityValidated={securityValidated}
          showSecurityDetails={showSecurityDetails}
          onToggleSecurityDetails={() => setShowSecurityDetails(!showSecurityDetails)}
        />

        {/* Dashboard Content */}
        <div className={isAdmin ? '' : 'container mx-auto px-4 py-6'}>
          {user.role === 'agent' && <AgentDashboard />}
          {user.role === 'clerk' && <ClerkDashboard />}
          {user.role === 'admin' && <AdminDashboard />}
        </div>
      </main>
      
      {/* Cookie Management */}
      <CookieManager userRole={user.role} />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <AppInitializer isLoading={isLoading} />
      {isAuthenticated ? <AuthenticatedApp /> : <AuthViews />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}