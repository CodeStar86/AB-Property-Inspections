/**
 * Security utilities for input validation and sanitization
 */

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script/gi, '') // Remove encoded script tags
    .trim();
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
};

// Password strength validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Property address validation
export const validatePropertyAddress = (address: string): boolean => {
  if (!address || address.length < 5 || address.length > 200) return false;
  
  // Basic UK address pattern (London focus)
  const ukAddressPattern = /^[a-zA-Z0-9\s,'-\.]+$/;
  return ukAddressPattern.test(address);
};

// Phone number validation (UK format)
export const validatePhoneNumber = (phone: string): boolean => {
  const ukPhonePattern = /^(\+44|0)[1-9]\d{8,9}$/;
  return ukPhonePattern.test(phone.replace(/\s/g, ''));
};

// File upload validation
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }
  
  // Check filename for suspicious patterns
  const dangerousPattern = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousPattern.test(file.name)) {
    return { isValid: false, error: 'Invalid filename' };
  }
  
  return { isValid: true };
};

// Detect suspicious input patterns
export const detectSuspiciousInput = (input: string): boolean => {
  if (!input) return false;
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /style\s*=.*expression/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /document\.cookie/i,
    /document\.write/i,
    /window\.location/i,
    /\.\.\//g, // Path traversal
    /union\s+select/i, // SQL injection
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// Note: Rate limiting functionality moved to /utils/rateLimiting.ts

// Security event logging
export const logSecurityEvent = async (event: string, details: any) => {
  try {
    console.warn('Security Event:', {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // In production, send to your logging service
    // await fetch('/api/security-log', { ... });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Note: detectSuspiciousInput function is defined above at line 88