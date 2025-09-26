/**
 * Utility functions for managing 2-week billing periods
 */

export interface BillingPeriod {
  start: Date;
  end: Date;
  periodNumber: number;
}

/**
 * Define the billing cycle start date (arbitrary start point - you can adjust this)
 * Using January 1, 2024 as the reference start date for billing cycles
 */
const BILLING_CYCLE_START = new Date('2024-01-01T00:00:00.000Z');

/**
 * Get the current billing period (2 weeks)
 */
export function getCurrentBillingPeriod(): BillingPeriod {
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - BILLING_CYCLE_START.getTime()) / (1000 * 60 * 60 * 24));
  const periodNumber = Math.floor(daysSinceStart / 14) + 1; // 14 days = 2 weeks
  
  // Calculate the start of the current period
  const periodsElapsed = periodNumber - 1;
  const periodStart = new Date(BILLING_CYCLE_START);
  periodStart.setDate(periodStart.getDate() + (periodsElapsed * 14));
  
  // Calculate the end of the current period
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 14);
  periodEnd.setSeconds(periodEnd.getSeconds() - 1); // End just before next period starts
  
  return {
    start: periodStart,
    end: periodEnd,
    periodNumber
  };
}

/**
 * Get a specific billing period by period number
 */
export function getBillingPeriod(periodNumber: number): BillingPeriod {
  const periodsElapsed = periodNumber - 1;
  const periodStart = new Date(BILLING_CYCLE_START);
  periodStart.setDate(periodStart.getDate() + (periodsElapsed * 14));
  
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 14);
  periodEnd.setSeconds(periodEnd.getSeconds() - 1);
  
  return {
    start: periodStart,
    end: periodEnd,
    periodNumber
  };
}

/**
 * Check if a date falls within a billing period
 */
export function isDateInBillingPeriod(date: Date, period: BillingPeriod): boolean {
  return date >= period.start && date <= period.end;
}

/**
 * Get the billing period that contains a specific date
 */
export function getBillingPeriodForDate(date: Date): BillingPeriod {
  const daysSinceStart = Math.floor((date.getTime() - BILLING_CYCLE_START.getTime()) / (1000 * 60 * 60 * 24));
  const periodNumber = Math.floor(daysSinceStart / 14) + 1;
  return getBillingPeriod(periodNumber);
}

/**
 * Format billing period for display
 */
export function formatBillingPeriod(period: BillingPeriod): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  
  const startStr = period.start.toLocaleDateString('en-GB', formatOptions);
  const endStr = period.end.toLocaleDateString('en-GB', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

/**
 * Get days remaining in current billing period
 */
export function getDaysRemainingInCurrentPeriod(): number {
  const currentPeriod = getCurrentBillingPeriod();
  const now = new Date();
  const timeRemaining = currentPeriod.end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
}

/**
 * Get detailed time remaining in current billing period
 */
export function getTimeRemainingInCurrentPeriod(): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const currentPeriod = getCurrentBillingPeriod();
  const now = new Date();
  const timeRemaining = Math.max(0, currentPeriod.end.getTime() - now.getTime());
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: timeRemaining
  };
}

/**
 * Get past billing periods
 */
export function getPastBillingPeriods(count: number): BillingPeriod[] {
  const currentPeriod = getCurrentBillingPeriod();
  const pastPeriods: BillingPeriod[] = [];
  
  for (let i = 1; i <= count; i++) {
    const periodNumber = currentPeriod.periodNumber - i;
    if (periodNumber > 0) {
      pastPeriods.push(getBillingPeriod(periodNumber));
    }
  }
  
  return pastPeriods;
}