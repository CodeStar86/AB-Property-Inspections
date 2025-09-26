import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertTriangle, Shield } from 'lucide-react';
import { config, isSecureContext } from '../../utils/config';

interface SecurityAlertsProps {
  userRole: string;
  securityValidated: boolean | null;
  showSecurityDetails: boolean;
  onToggleSecurityDetails: () => void;
}

export function SecurityAlerts({ 
  userRole, 
  securityValidated, 
  showSecurityDetails, 
  onToggleSecurityDetails 
}: SecurityAlertsProps) {
  return (
    <>
      {/* Admin Security Alert */}
      {userRole === 'admin' && securityValidated === false && (
        <div className="container mx-auto px-4 py-6">
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Critical security issues detected. Please review and address immediately.</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleSecurityDetails}
              >
                <Shield className="h-4 w-4 mr-2" />
                {showSecurityDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Development Security Warning */}
      {config.isDevelopment && !isSecureContext() && (
        <div className="container mx-auto px-4 py-2">
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Development Warning: Running in non-secure context. HTTPS recommended for production.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}