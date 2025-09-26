// Cookie utility functions for AB Property Inspection Services
export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const COOKIE_CONSENT_KEY = 'ab-cookie-consent';
export const COOKIE_CONSENT_DATE_KEY = 'ab-cookie-consent-date';

// Cookie management functions
export const cookieUtils = {
  // Set a cookie with options
  setCookie: (name: string, value: string, days: number = 365, sameSite: 'Strict' | 'Lax' | 'None' = 'Lax') => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=${sameSite}; Secure`;
  },

  // Get a cookie value
  getCookie: (name: string): string | null => {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  },

  // Delete a cookie
  deleteCookie: (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  },

  // Check if cookies are enabled
  areCookiesEnabled: (): boolean => {
    try {
      document.cookie = 'test=1';
      const enabled = document.cookie.includes('test=1');
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return enabled;
    } catch {
      return false;
    }
  },

  // Get current cookie preferences
  getPreferences: (): CookiePreferences | null => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Save cookie preferences
  savePreferences: (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    localStorage.setItem(COOKIE_CONSENT_DATE_KEY, new Date().toISOString());
  },

  // Check if user has given consent
  hasConsent: (): boolean => {
    return !!localStorage.getItem(COOKIE_CONSENT_KEY);
  },

  // Check if specific category is enabled
  isCategoryEnabled: (category: keyof CookiePreferences): boolean => {
    const preferences = cookieUtils.getPreferences();
    return preferences ? preferences[category] : false;
  },

  // Clear all consent data
  clearConsent: () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_CONSENT_DATE_KEY);
    
    // Clear all non-necessary cookies
    const allCookies = document.cookie.split(';');
    
    allCookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Keep necessary cookies for app functionality
      const necessaryCookies = ['auth-token', 'session-id', 'csrf-token'];
      
      if (!necessaryCookies.includes(name)) {
        cookieUtils.deleteCookie(name);
      }
    });
  },

  // Analytics tracking (only if consent given)
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    if (cookieUtils.isCategoryEnabled('analytics')) {
      // Implement your analytics tracking here
      console.log('Analytics Event:', eventName, properties);
      
      // Example: Google Analytics 4
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
      }
    }
  },

  // Set functional cookies (if consent given)
  setFunctionalCookie: (name: string, value: string, days: number = 30) => {
    if (cookieUtils.isCategoryEnabled('functional')) {
      cookieUtils.setCookie(`ab_func_${name}`, value, days);
    }
  },

  // Set marketing cookies (if consent given)
  setMarketingCookie: (name: string, value: string, days: number = 30) => {
    if (cookieUtils.isCategoryEnabled('marketing')) {
      cookieUtils.setCookie(`ab_mkt_${name}`, value, days);
    }
  },

  // Get consent date
  getConsentDate: (): Date | null => {
    const dateStr = localStorage.getItem(COOKIE_CONSENT_DATE_KEY);
    return dateStr ? new Date(dateStr) : null;
  },

  // Check if consent needs refresh (e.g., after 1 year)
  needsConsentRefresh: (maxAgeMonths: number = 12): boolean => {
    const consentDate = cookieUtils.getConsentDate();
    if (!consentDate) return true;
    
    const maxAge = maxAgeMonths * 30 * 24 * 60 * 60 * 1000; // months to milliseconds
    return Date.now() - consentDate.getTime() > maxAge;
  }
};

// Privacy-focused localStorage wrapper
export const privacyStorage = {
  // Only store if functional cookies are enabled
  setItem: (key: string, value: string) => {
    if (cookieUtils.isCategoryEnabled('functional')) {
      localStorage.setItem(`ab_${key}`, value);
    }
  },

  getItem: (key: string): string | null => {
    if (cookieUtils.isCategoryEnabled('functional')) {
      return localStorage.getItem(`ab_${key}`);
    }
    return null;
  },

  removeItem: (key: string) => {
    localStorage.removeItem(`ab_${key}`);
  },

  // For essential app data (always allowed)
  setEssentialItem: (key: string, value: string) => {
    localStorage.setItem(`ab_essential_${key}`, value);
  },

  getEssentialItem: (key: string): string | null => {
    return localStorage.getItem(`ab_essential_${key}`);
  }
};

// Default cookie preferences for different user roles
export const defaultPreferences: Record<string, CookiePreferences> = {
  agent: {
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  },
  clerk: {
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  },
  admin: {
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false
  }
};