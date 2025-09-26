/**
 * Server-side rate limiting for Supabase Edge Functions
 * Implements rate limiting on top of Supabase's built-in limits
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class ServerRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  
  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
  
  checkLimit(
    identifier: string, 
    maxRequests: number, 
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);
    
    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= maxRequests) {
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
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }
}

// Global rate limiter instance
export const serverRateLimiter = new ServerRateLimiter();

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  SIGNUP: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 signups per hour
  
  // Property operations
  PROPERTY_CREATE: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  PROPERTY_UPDATE: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  
  // Inspection operations
  INSPECTION_CREATE: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  INSPECTION_UPDATE: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  
  // Financial operations (stricter)
  FINANCIAL_CREATE: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  INVOICE_CREATE: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  
  // Admin operations (very strict)
  ADMIN_DELETE: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  USER_DELETE: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  
  // General API
  API_GENERAL: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
} as const;

// Helper function to get client IP
export const getClientIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || clientIP || 'unknown';
};

// Middleware creator for rate limiting
export const createRateLimitMiddleware = (
  getLimitConfig: (request: Request) => { maxRequests: number; windowMs: number },
  getIdentifier: (request: Request, userId?: string) => string
) => {
  return async (c: any, next: any) => {
    const request = c.req.raw;
    const userId = c.get('userId'); // From auth middleware
    
    const config = getLimitConfig(request);
    const identifier = getIdentifier(request, userId);
    
    const result = serverRateLimiter.checkLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );
    
    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());
      
      console.log(`Rate limit exceeded for ${identifier}:`, {
        limit: config.maxRequests,
        window: config.windowMs,
        retryAfter
      });
      
      return c.json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter
      }, 429);
    }
    
    await next();
  };
};

// Predefined middleware for common use cases
export const authRateLimit = createRateLimitMiddleware(
  () => RATE_LIMITS.LOGIN,
  (request) => {
    const ip = getClientIP(request);
    return `auth:${ip}`;
  }
);

export const propertyRateLimit = createRateLimitMiddleware(
  () => RATE_LIMITS.PROPERTY_CREATE,
  (request, userId) => {
    const ip = getClientIP(request);
    return userId ? `property:user:${userId}` : `property:ip:${ip}`;
  }
);

export const inspectionRateLimit = createRateLimitMiddleware(
  () => RATE_LIMITS.INSPECTION_CREATE,
  (request, userId) => {
    const ip = getClientIP(request);
    return userId ? `inspection:user:${userId}` : `inspection:ip:${ip}`;
  }
);

export const financialRateLimit = createRateLimitMiddleware(
  () => RATE_LIMITS.FINANCIAL_CREATE,
  (request, userId) => {
    const ip = getClientIP(request);
    return userId ? `financial:user:${userId}` : `financial:ip:${ip}`;
  }
);

export const adminRateLimit = createRateLimitMiddleware(
  () => RATE_LIMITS.ADMIN_DELETE,
  (request, userId) => {
    const ip = getClientIP(request);
    return userId ? `admin:user:${userId}` : `admin:ip:${ip}`;
  }
);

// General API rate limit
export const generalRateLimit = createRateLimitMiddleware(
  () => RATE_LIMITS.API_GENERAL,
  (request, userId) => {
    const ip = getClientIP(request);
    return userId ? `api:user:${userId}` : `api:ip:${ip}`;
  }
);

// Security event logging
export const logSecurityEvent = (event: string, details: any) => {
  console.log('🚨 Security Event:', {
    timestamp: new Date().toISOString(),
    event,
    details,
    server: 'supabase-edge-function'
  });
};