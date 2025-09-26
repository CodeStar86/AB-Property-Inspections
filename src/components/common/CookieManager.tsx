import React, { useState, useEffect } from 'react';
import { CookieConsent } from '../privacy/CookieConsent';
import { cookieUtils, CookiePreferences } from '../../utils/cookieUtils';
import { toast } from 'sonner';

interface CookieManagerProps {
  userRole: string;
}

export function CookieManager({ userRole }: CookieManagerProps) {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    if (userRole === 'agent' || userRole === 'clerk') {
      const hasConsent = cookieUtils.hasConsent();
      const needsRefresh = cookieUtils.needsConsentRefresh();
      
      if (!hasConsent || needsRefresh) {
        setShowCookieConsent(true);
      }
    }
  }, [userRole]);

  const handleCookieAccept = (preferences: CookiePreferences) => {
    cookieUtils.savePreferences(preferences);
    setShowCookieConsent(false);
    
    if (preferences.analytics) {
      cookieUtils.trackEvent('cookie_consent_given', { 
        user_role: userRole,
        preferences 
      });
    }
    
    toast.success('Cookie preferences saved successfully');
  };

  const handleCookieDecline = () => {
    const minimalPreferences: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    
    cookieUtils.savePreferences(minimalPreferences);
    setShowCookieConsent(false);
    toast.info('Only essential cookies will be used');
  };

  if (!showCookieConsent || (userRole !== 'agent' && userRole !== 'clerk')) {
    return null;
  }

  return (
    <CookieConsent 
      onAccept={handleCookieAccept}
      onDecline={handleCookieDecline}
    />
  );
}