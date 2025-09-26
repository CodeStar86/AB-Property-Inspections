import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Cookie, Shield, Settings, Eye, X } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentProps {
  onAccept: (preferences: CookiePreferences) => void;
  onDecline: () => void;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('ab-cookie-consent');
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    localStorage.setItem('ab-cookie-consent', JSON.stringify(allAccepted));
    localStorage.setItem('ab-cookie-consent-date', new Date().toISOString());
    onAccept(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('ab-cookie-consent', JSON.stringify(preferences));
    localStorage.setItem('ab-cookie-consent-date', new Date().toISOString());
    onAccept(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleDeclineAll = () => {
    const minimal: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    localStorage.setItem('ab-cookie-consent', JSON.stringify(minimal));
    localStorage.setItem('ab-cookie-consent-date', new Date().toISOString());
    onDecline();
    setShowBanner(false);
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Cookie Preferences</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    We use cookies to enhance your experience with AB Property Inspection Services. 
                    Essential cookies are required for the app to function, while others help us improve our services.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      GDPR Compliant
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Data Protected
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Cookie className="h-5 w-5 text-purple-600" />
                          Cookie Preferences
                        </DialogTitle>
                        <DialogDescription>
                          Manage your cookie preferences for AB Property Inspection Services
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Necessary Cookies */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                              <p className="text-sm text-gray-600">
                                Essential for the website to function. Cannot be disabled.
                              </p>
                            </div>
                            <Switch checked={true} disabled className="ml-4" />
                          </div>
                          <div className="text-xs text-gray-500 pl-4 border-l-2 border-purple-200">
                            Authentication, security, form submissions, user sessions
                          </div>
                        </div>

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
                            Dashboard preferences, saved filters, display settings
                          </div>
                        </div>

                        {/* Analytics Cookies */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
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
                            Usage statistics, performance monitoring, error tracking
                          </div>
                        </div>

                        {/* Marketing Cookies */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
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
                            Targeted content, campaign tracking, third-party integrations
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                        <Button 
                          onClick={handleAcceptSelected}
                          className="flex-1 bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0"
                        >
                          Save Preferences
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowSettings(false)}
                          className="sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeclineAll}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Decline All
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={handleAcceptAll}
                    className="bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Cookie Management Hook
export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ab-cookie-consent');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setHasConsent(true);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const updateConsent = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences);
    setHasConsent(true);
  };

  const clearConsent = () => {
    localStorage.removeItem('ab-cookie-consent');
    localStorage.removeItem('ab-cookie-consent-date');
    setPreferences(null);
    setHasConsent(false);
  };

  return {
    hasConsent,
    preferences,
    updateConsent,
    clearConsent
  };
}