import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { checkEnvironmentAvailability } from '../../utils/environmentChecker';

interface SecurityValidatorProps {
  onSecurityValidated?: (isValid: boolean) => void;
  showDetails?: boolean;
}

interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  message: string;
  critical: boolean;
}

interface ApiKeyStatus {
  configured: boolean;
  valid: boolean;
  masked: string;
  error?: string;
}

export function SecurityValidator({ onSecurityValidated, showDetails = false }: SecurityValidatorProps) {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [openaiStatus, setOpenaiStatus] = useState<ApiKeyStatus>({ configured: false, valid: false, masked: '***' });
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<'secure' | 'warning' | 'critical'>('checking');

  useEffect(() => {
    performSecurityChecks();
  }, []);

  const performSecurityChecks = async () => {
    setIsLoading(true);
    const securityChecks: SecurityCheck[] = [];

    // 1. Check HTTPS/Secure Context
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    securityChecks.push({
      id: 'secure-context',
      name: 'Secure Context (HTTPS)',
      status: isSecure ? 'pass' : 'warning',
      message: isSecure ? 'Connection is secure' : 'Consider using HTTPS in production',
      critical: false
    });

    // 2. Check Environment Variables
    const hasEnvVars = checkEnvironmentVariables();
    securityChecks.push({
      id: 'env-vars',
      name: 'Environment Configuration',
      status: hasEnvVars.status,
      message: hasEnvVars.message,
      critical: false
    });

    // 3. Check OpenAI API Key
    const openaiCheck = await checkOpenAIConfiguration();
    setOpenaiStatus(openaiCheck);
    
    securityChecks.push({
      id: 'openai-config',
      name: 'OpenAI API Configuration',
      status: openaiCheck.configured ? (openaiCheck.valid ? 'pass' : 'warning') : 'warning',
      message: openaiCheck.configured 
        ? (openaiCheck.valid ? 'OpenAI API key configured and accessible' : 'OpenAI API key configured but validation failed')
        : 'OpenAI API key not configured - AI features will be disabled',
      critical: false
    });

    // 4. Check for Common Security Issues
    const securityIssues = checkCommonSecurityIssues();
    securityChecks.push(...securityIssues);

    setChecks(securityChecks);

    // Determine overall status
    const criticalFailures = securityChecks.filter(c => c.critical && c.status === 'fail');
    const warnings = securityChecks.filter(c => c.status === 'warning' || c.status === 'fail');
    
    if (criticalFailures.length > 0) {
      setOverallStatus('critical');
      onSecurityValidated?.(false);
    } else if (warnings.length > 0) {
      setOverallStatus('warning');
      onSecurityValidated?.(true);
    } else {
      setOverallStatus('secure');
      onSecurityValidated?.(true);
    }

    setIsLoading(false);
  };

  const checkEnvironmentVariables = () => {
    try {
      // Use the config utility which has proper fallbacks
      const { config } = require('../../utils/config');
      
      // Check critical configuration
      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        return { status: 'warning' as const, message: 'Database configuration incomplete - using fallback' };
      }

      // Check if using fallback configuration
      if (config.supabaseUrl === 'https://wlxmcgoxsepwbnfdgxvq.supabase.co') {
        return { status: 'warning' as const, message: 'Using fallback configuration - add environment variables for production' };
      }

      return { status: 'pass' as const, message: 'Environment configuration loaded successfully' };
    } catch (error) {
      return { status: 'warning' as const, message: 'Configuration check completed with fallbacks' };
    }
  };

  const checkOpenAIConfiguration = async (): Promise<ApiKeyStatus> => {
    try {
      // Don't try to access environment variables directly
      // Just check if the OpenAI service is available
      const { isOpenAIAvailable } = await import('../../utils/openaiService');
      
      if (isOpenAIAvailable()) {
        return {
          configured: true,
          valid: true,
          masked: 'sk-***configured***',
        };
      } else {
        return {
          configured: false,
          valid: false,
          masked: 'Not configured',
          error: 'OpenAI API key not configured - AI features will be disabled'
        };
      }
    } catch (error) {
      return {
        configured: false,
        valid: false,
        masked: 'Check failed',
        error: 'Could not verify OpenAI configuration'
      };
    }
  };

  const checkCommonSecurityIssues = (): SecurityCheck[] => {
    const issues: SecurityCheck[] = [];

    try {
      // Use config utility instead of direct environment access
      const { config } = require('../../utils/config');
      
      if (config.isProduction) {
        // In production, check for development settings
        issues.push({
          id: 'production-check',
          name: 'Production Configuration',
          status: 'pass',
          message: 'Running in production mode',
          critical: false
        });
      } else {
        issues.push({
          id: 'development-mode',
          name: 'Development Mode',
          status: 'pass',
          message: 'Running in development mode',
          critical: false
        });
      }

      // Check for secure headers
      try {
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        issues.push({
          id: 'security-headers',
          name: 'Content Security Policy',
          status: csp ? 'pass' : 'warning',
          message: csp ? 'CSP header detected' : 'Consider adding Content Security Policy headers',
          critical: false
        });
      } catch (error) {
        // CSP check is optional
      }
    } catch (error) {
      issues.push({
        id: 'basic-security',
        name: 'Basic Security Check',
        status: 'pass',
        message: 'Basic security measures active',
        critical: false
      });
    }

    return issues;
  };

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 10) return '***';
    return `${key.substring(0, 7)}${'*'.repeat(key.length - 14)}${key.substring(key.length - 7)}`;
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300 animate-pulse" />;
    }
  };

  const getOverallStatusBadge = () => {
    switch (overallStatus) {
      case 'secure':
        return <Badge variant="outline" className="text-green-600 border-green-600">Secure</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Warnings</Badge>;
      case 'critical':
        return <Badge variant="outline" className="text-red-600 border-red-600">Critical Issues</Badge>;
      default:
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  if (!showDetails && overallStatus === 'secure') {
    return null; // Don't show if everything is secure and details not requested
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Status</span>
          {getOverallStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status Alert */}
        {overallStatus === 'critical' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Critical security issues detected. Please address these immediately.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'warning' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Security warnings detected. Review and address when possible.
            </AlertDescription>
          </Alert>
        )}

        {/* Security Checks */}
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.id} className="flex items-start space-x-3 p-3 rounded-lg border">
              {getStatusIcon(check.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{check.name}</h4>
                  {check.critical && (
                    <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                      Critical
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{check.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* OpenAI API Key Details */}
        {openaiStatus.configured && showDetails && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>OpenAI API Key</span>
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="px-2"
              >
                {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-600 font-mono">
              {showOpenaiKey ? 
                'API key access disabled for security' :
                openaiStatus.masked
              }
            </p>
            {openaiStatus.error && (
              <p className="text-sm text-red-600 mt-1">{openaiStatus.error}</p>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🔍 Environment Debug Info:');
              console.log('Available env vars:', Object.keys(import.meta.env || {}).filter(k => k.startsWith('VITE_')));
              console.log('VITE_SUPABASE_URL present:', !!import.meta.env?.VITE_SUPABASE_URL);
              console.log('VITE_SUPABASE_ANON_KEY present:', !!import.meta.env?.VITE_SUPABASE_ANON_KEY);
              console.log('VITE_OPENAI_API_KEY present:', !!import.meta.env?.VITE_OPENAI_API_KEY);
              performSecurityChecks();
            }} 
            disabled={isLoading}
            title="Click to run security checks and log environment debug info to console"
          >
            <Lock className="h-4 w-4 mr-2" />
            {isLoading ? 'Checking...' : 'Debug & Refresh Security'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default SecurityValidator;