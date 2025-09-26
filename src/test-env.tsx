/**
 * Environment Variables Test Component
 * Use this to verify environment variables are loading correctly
 */

import React from 'react';
import { config, getEnvironmentInfo } from './utils/config';

export function EnvironmentTest() {
  const envInfo = getEnvironmentInfo();
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999 
    }}>
      <h4>🔧 Environment Test</h4>
      <div>
        <strong>Status:</strong> {envInfo.supabaseConfigured ? '✅ Configured' : '❌ Missing'}
      </div>
      <div>
        <strong>Environment:</strong> {envInfo.environment}
      </div>
      <div>
        <strong>Supabase URL:</strong> {envInfo.supabaseUrlMasked}
      </div>
      <div>
        <strong>Secure Context:</strong> {envInfo.hasSecureContext ? '✅ Yes' : '❌ No'}
      </div>
      {!envInfo.supabaseConfigured && (
        <div style={{ color: 'red', marginTop: '5px' }}>
          Run: node fix-env.js
        </div>
      )}
    </div>
  );
}

// Optional: Use this in your App.tsx temporarily to debug
// import { EnvironmentTest } from './test-env';
// Add <EnvironmentTest /> to your JSX

export default EnvironmentTest;