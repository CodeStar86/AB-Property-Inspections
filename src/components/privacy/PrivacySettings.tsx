import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  Shield, 
  Cookie, 
  Eye, 
  Download, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Lock
} from 'lucide-react';
import { cookieUtils, CookiePreferences } from '../../utils/cookieUtils';
import { DataProtectionPolicy } from './DataProtectionPolicy';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  userRole: 'agent' | 'clerk' | 'admin';
  userName: string;
  userEmail: string;
}

export function PrivacySettings({ userRole, userName, userEmail }: PrivacySettingsProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [consentDate, setConsentDate] = useState<Date | null>(null);

  useEffect(() => {
    // Load current preferences
    const current = cookieUtils.getPreferences();
    const date = cookieUtils.getConsentDate();
    
    if (current) {
      setPreferences(current);
    }
    
    if (date) {
      setConsentDate(date);
    }
  }, []);

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const savePreferences = () => {
    cookieUtils.savePreferences(preferences);
    setConsentDate(new Date());
    setHasChanges(false);
    
    if (preferences.analytics) {
      cookieUtils.trackEvent('privacy_settings_updated', { 
        user_role: userRole,
        preferences 
      });
    }
    
    toast.success('Privacy preferences updated successfully');
  };

  const resetPreferences = () => {
    cookieUtils.clearConsent();
    setPreferences({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    });
    setConsentDate(null);
    setHasChanges(false);
    toast.info('Cookie preferences reset. Please refresh the page.');
    setTimeout(() => window.location.reload(), 2000);
  };

  const exportData = () => {
    // Simulate data export
    const userData = {
      name: userName,
      email: userEmail,
      role: userRole,
      cookiePreferences: preferences,
      consentDate: consentDate?.toISOString(),
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ab-inspection-data-${userEmail}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Your data has been exported successfully');
  };

  const requestDataDeletion = () => {
    // In a real app, this would trigger a data deletion request
    toast.info('Data deletion request submitted. You will be contacted within 30 days.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Privacy & Data Protection
          </CardTitle>
          <CardDescription>
            Manage your privacy settings and control how your data is used in AB Property Inspection Services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              GDPR Compliant
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              End-to-End Encrypted
            </Badge>
            <Badge variant="outline" className="text-xs">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Account
            </Badge>
          </div>
          
          {consentDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last updated: {consentDate.toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-blue-600" />
            Cookie Preferences
          </CardTitle>
          <CardDescription>
            Control which cookies we use to enhance your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Necessary Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Essential Cookies</h4>
                <p className="text-sm text-gray-600">
                  Required for the app to function properly. Cannot be disabled.
                </p>
              </div>
              <Switch checked={true} disabled className="ml-4" />
            </div>
            <div className="text-xs text-gray-500 pl-4 border-l-2 border-purple-200">
              Authentication, security, form submissions, user sessions
            </div>
          </div>

          <Separator />

          {/* Functional Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Functional Cookies</h4>
                <p className="text-sm text-gray-600">
                  Remember your preferences and settings for a better experience.
                </p>
              </div>
              <Switch 
                checked={preferences.functional}
                onCheckedChange={(checked) => updatePreference('functional', checked)}
                className="ml-4"
              />
            </div>
            <div className="text-xs text-gray-500 pl-4 border-l-2 border-blue-200">
              Dashboard preferences, saved filters, display settings, language preferences
            </div>
          </div>

          <Separator />

          {/* Analytics Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Performance & Analytics</h4>
                <p className="text-sm text-gray-600">
                  Help us understand how you use the app to improve our services.
                </p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => updatePreference('analytics', checked)}
                className="ml-4"
              />
            </div>
            <div className="text-xs text-gray-500 pl-4 border-l-2 border-green-200">
              Usage statistics, performance monitoring, error tracking, feature usage
            </div>
          </div>

          <Separator />

          {/* Marketing Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Marketing & Personalization</h4>
                <p className="text-sm text-gray-600">
                  Used to show you relevant content and measure campaign effectiveness.
                </p>
              </div>
              <Switch 
                checked={preferences.marketing}
                onCheckedChange={(checked) => updatePreference('marketing', checked)}
                className="ml-4"
              />
            </div>
            <div className="text-xs text-gray-500 pl-4 border-l-2 border-orange-200">
              Targeted content, campaign tracking, third-party integrations, personalized recommendations
            </div>
          </div>

          {hasChanges && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes to your cookie preferences.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button 
              onClick={savePreferences}
              disabled={!hasChanges}
              className="flex-1 sm:flex-none bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0"
            >
              Save Preferences
            </Button>
            <Button 
              variant="outline" 
              onClick={resetPreferences}
              className="sm:w-auto"
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Your Data Rights
          </CardTitle>
          <CardDescription>
            Exercise your rights under GDPR and UK Data Protection laws
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Export Data */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                Export Your Data
              </h4>
              <p className="text-sm text-gray-600">
                Download a copy of all your personal data in a portable format.
              </p>
              <Button 
                onClick={exportData}
                variant="outline"
                size="sm"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Delete Data */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-600" />
                Delete Your Data
              </h4>
              <p className="text-sm text-gray-600">
                Request permanent deletion of your personal data from our systems.
              </p>
              <Button 
                onClick={requestDataDeletion}
                variant="outline"
                size="sm"
                className="w-full border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Request Deletion
              </Button>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Data deletion requests are irreversible and may affect your ability to use the service. 
              Some data may be retained for legal compliance purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Privacy Information
          </CardTitle>
          <CardDescription>
            Learn more about how we protect and use your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <DataProtectionPolicy 
              trigger={
                <Button variant="outline" className="flex-1 sm:flex-none border-purple-200 text-purple-700 hover:bg-purple-50">
                  <Shield className="h-4 w-4 mr-2" />
                  View Privacy Policy
                </Button>
              }
            />
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => window.open('mailto:dpo@abpropertyinspections.co.uk', '_blank')}
            >
              Contact Data Protection Officer
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}