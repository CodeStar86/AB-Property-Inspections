import { useEffect } from 'react';
import { config, isSecureContext } from '../../utils/config';
import { markStartupComplete } from '../../utils/startupManager';

interface AppInitializerProps {
  isLoading: boolean;
  onInitComplete?: () => void;
}

export function AppInitializer({ isLoading, onInitComplete }: AppInitializerProps) {
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        markStartupComplete();
        onInitComplete?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onInitComplete]);

  useEffect(() => {
    const performBasicSecurityCheck = () => {
      try {
        const secure = isSecureContext();
        if (!secure && config.isProduction) {
          console.warn('⚠️ App not using HTTPS in production - consider enabling secure connection');
        }

        if (config.isDevelopment) {
          console.log('🔒 Security check complete - app ready');
        }
      } catch (error) {
        console.warn('⚠️ Security check encountered minor issues, but app will continue normally');
      }
    };

    const loadDevelopmentTools = async () => {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev && config.isDevelopment) {
        try {
          console.log('🔧 Loading development tools...');
          await import('../../utils/devTools');
          console.log('✅ Development tools loaded');
        } catch (error) {
          console.log('🔧 Development tools not available - continuing with basic functionality');
        }
      }
    };

    performBasicSecurityCheck();
    
    const timer = setTimeout(loadDevelopmentTools, 500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}