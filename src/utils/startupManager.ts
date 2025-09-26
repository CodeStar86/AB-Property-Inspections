/**
 * Startup Manager - Handles app initialization timing and reduces noisy startup warnings
 */

let appStartupComplete = false;
let startupTime = Date.now();

/**
 * Mark app startup as complete
 */
export function markStartupComplete(): void {
  appStartupComplete = true;
  const duration = Date.now() - startupTime;
  console.log(`✅ App startup complete in ${duration}ms`);
}

/**
 * Check if we're still in the startup phase
 */
export function isInStartupPhase(): boolean {
  const timeSinceStart = Date.now() - startupTime;
  return !appStartupComplete && timeSinceStart < 3000; // 3 second startup grace period
}

/**
 * Log a message only if we're past the startup phase
 */
export function logAfterStartup(level: 'log' | 'warn' | 'error', message: string, ...args: any[]): void {
  if (!isInStartupPhase()) {
    console[level](message, ...args);
  }
}

/**
 * Reset startup timing (useful for testing)
 */
export function resetStartupTimer(): void {
  appStartupComplete = false;
  startupTime = Date.now();
}

/**
 * Get startup duration in milliseconds
 */
export function getStartupDuration(): number {
  return Date.now() - startupTime;
}

export default {
  markStartupComplete,
  isInStartupPhase,
  logAfterStartup,
  resetStartupTimer,
  getStartupDuration
};