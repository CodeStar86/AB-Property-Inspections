/**
 * Enhanced rate limiting for property inspection app
 * Adds custom limits on top of Supabase's built-in limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class AdvancedRateLimiter {
  private store: RateLimitStore = {};
  
  // Clean up expired entries every 5 minutes
  constructor() {
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 5 * 60 * 1000);
  }
  
  checkLimit(
    identifier: string, 
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;
    const entry = this.store[key];
    
    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs
      };
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    // Increment counter
    entry.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }
  
  getRemainingTime(identifier: string): number {
    const entry = this.store[identifier];
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }
}

// Global rate limiter instance
export const rateLimiter = new AdvancedRateLimiter();

// Predefined rate limit configurations for your app
export const RATE_LIMITS = {
  // Authentication limits
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  PASSWORD_RESET: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  
  // Property management limits
  PROPERTY_REGISTRATION: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  PROPERTY_UPDATE: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  
  // Inspection limits
  INSPECTION_BOOKING: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  INSPECTION_COMPLETION: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour
  PHOTO_UPLOAD: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  
  // Financial operations (stricter limits)
  INVOICE_GENERATION: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  PAYMENT_PROCESSING: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  
  // Admin operations
  USER_CREATION: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  BULK_OPERATIONS: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  
  // General API limits
  API_GENERAL: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
  SEARCH: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
} as const;

// Helper functions for common use cases
export const checkAuthLimit = (userEmail: string) => {
  return rateLimiter.checkLimit(`auth:${userEmail}`, RATE_LIMITS.LOGIN);
};

export const checkPropertyLimit = (userId: string, action: 'create' | 'update') => {
  const config = action === 'create' ? 
    RATE_LIMITS.PROPERTY_REGISTRATION : 
    RATE_LIMITS.PROPERTY_UPDATE;
  return rateLimiter.checkLimit(`property:${action}:${userId}`, config);
};

export const checkInspectionLimit = (userId: string, action: 'booking' | 'completion') => {
  const config = action === 'booking' ? 
    RATE_LIMITS.INSPECTION_BOOKING : 
    RATE_LIMITS.INSPECTION_COMPLETION;
  return rateLimiter.checkLimit(`inspection:${action}:${userId}`, config);
};

export const checkFileUploadLimit = (userId: string) => {
  return rateLimiter.checkLimit(`upload:${userId}`, RATE_LIMITS.PHOTO_UPLOAD);
};

export const checkFinancialLimit = (userId: string, action: 'invoice' | 'payment') => {
  const config = action === 'invoice' ? 
    RATE_LIMITS.INVOICE_GENERATION : 
    RATE_LIMITS.PAYMENT_PROCESSING;
  return rateLimiter.checkLimit(`financial:${action}:${userId}`, config);
};

// Middleware helper for API routes
export const createRateLimitMiddleware = (
  getIdentifier: (req: any) => string,
  config: RateLimitConfig
) => {
  return (req: any, res: any, next: any) => {
    const identifier = getIdentifier(req);
    const result = rateLimiter.checkLimit(identifier, config);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: config.message || 'Rate limit exceeded. Please try again later.',
        retryAfter
      });
    }
    
    next();
  };
};

// IP-based rate limiting (for anonymous users)
export const getClientIP = (request: Request): string => {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
};

// User-based rate limiting (for authenticated users)
export const getUserIdentifier = (userId?: string, email?: string, ip?: string): string => {
  if (userId) return `user:${userId}`;
  if (email) return `email:${email}`;
  return `ip:${ip || 'unknown'}`;
};