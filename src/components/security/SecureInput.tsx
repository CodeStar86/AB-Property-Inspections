import React, { useState, useCallback } from 'react';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { sanitizeInput, detectSuspiciousInput, logSecurityEvent } from '../../utils/security';

interface SecureInputProps extends React.ComponentProps<typeof Input> {
  onSecurityViolation?: (input: string) => void;
  allowHtml?: boolean;
  maxLength?: number;
}

/**
 * Secure Input Component - Automatically sanitizes and validates input
 * Use this instead of regular Input for sensitive forms
 */
export function SecureInput({ 
  onSecurityViolation, 
  allowHtml = false, 
  maxLength = 1000,
  onChange,
  ...props 
}: SecureInputProps) {
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Check for suspicious patterns
    if (detectSuspiciousInput(rawValue)) {
      setSecurityWarning('Potentially unsafe input detected and blocked');
      logSecurityEvent('suspicious_input_blocked', { 
        input: rawValue.substring(0, 100), // Log first 100 chars only
        field: props.name || props.id || 'unknown'
      });
      
      if (onSecurityViolation) {
        onSecurityViolation(rawValue);
      }
      return; // Block the input
    }
    
    // Clear any existing warning
    if (securityWarning) {
      setSecurityWarning(null);
    }
    
    // Sanitize input if HTML is not allowed
    const sanitizedValue = allowHtml ? rawValue : sanitizeInput(rawValue);
    
    // Check length limit
    if (sanitizedValue.length > maxLength) {
      setSecurityWarning(`Input too long. Maximum ${maxLength} characters allowed.`);
      return;
    }
    
    // Create new event with sanitized value
    const sanitizedEvent = {
      ...e,
      target: {
        ...e.target,
        value: sanitizedValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    if (onChange) {
      onChange(sanitizedEvent);
    }
  }, [onChange, allowHtml, maxLength, onSecurityViolation, securityWarning, props.name, props.id]);
  
  return (
    <div className="space-y-2">
      <Input
        {...props}
        onChange={handleChange}
      />
      {securityWarning && (
        <Alert variant="destructive">
          <AlertDescription>{securityWarning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}