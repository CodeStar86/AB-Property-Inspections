/**
 * Cashback processing utilities - now agent-specific instead of period-specific
 */

import { 
  ProcessedBillingPeriod, 
  Inspection, 
  BillingPeriod,
  User 
} from '../types';
import { 
  getCurrentBillingPeriod, 
  getBillingPeriod, 
  isDateInBillingPeriod 
} from './billingPeriods';

// New interface for agent-specific cashback processing
export interface ProcessedAgentCashback {
  id: string;
  agentId: string;
  agentName: string;
  periodNumber: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  inspections: Inspection[];
  totalRevenue: number;
  cashbackAmount: number;
  processedAt: string;
  processedBy: string;
  notes?: string;
}

// Interface for agents with unprocessed cashback
export interface AgentCashbackStatus {
  agentId: string;
  agentName: string;
  unprocessedCashback: number;
  unprocessedRevenue: number;
  unprocessedInspections: Inspection[];
  periodsWithCashback: {
    periodNumber: number;
    period: BillingPeriod;
    inspections: Inspection[];
    revenue: number;
    cashback: number;
  }[];
}

export interface CashbackCalculation {
  periodNumber: number;
  period: BillingPeriod;
  completedInspections: Inspection[];
  totalRevenue: number;
  totalCashback: number; // 15% for agents
  totalCommission: number; // 30% for clerks
  netRevenue: number; // 55% for company
  isProcessed: boolean;
}

export interface AgentCashbackBreakdown {
  agentId: string;
  agentName: string;
  inspections: Inspection[];
  totalRevenue: number;
  cashbackAmount: number;
}

export interface ClerkCommissionBreakdown {
  clerkId: string;
  clerkName: string;
  inspections: Inspection[];
  totalRevenue: number;
  commissionAmount: number;
}

/**
 * Check if a billing period has already been processed for cashback
 */
export function isBillingPeriodProcessedForCashback(
  periodNumber: number,
  processedPeriods: ProcessedBillingPeriod[]
): boolean {
  return processedPeriods.some(p => 
    p.periodNumber === periodNumber && 
    (p.processedType === 'cashback' || p.processedType === 'both')
  );
}

/**
 * Check if a billing period has already been processed for commission
 */
export function isBillingPeriodProcessedForCommission(
  periodNumber: number,
  processedPeriods: ProcessedBillingPeriod[]
): boolean {
  return processedPeriods.some(p => 
    p.periodNumber === periodNumber && 
    (p.processedType === 'commission' || p.processedType === 'both')
  );
}

/**
 * Legacy function for backward compatibility - checks for cashback processing
 */
export function isBillingPeriodProcessed(
  periodNumber: number,
  processedPeriods: ProcessedBillingPeriod[]
): boolean {
  return isBillingPeriodProcessedForCashback(periodNumber, processedPeriods);
}

/**
 * Calculate cashback for a specific billing period, checking if already processed
 * Note: Commission is NOT processed here - only cashback is reset after processing
 */
export function calculatePeriodCashback(
  periodNumber: number,
  inspections: Inspection[],
  processedPeriods: ProcessedBillingPeriod[]
): CashbackCalculation {
  const period = getBillingPeriod(periodNumber);
  const isCashbackProcessed = isBillingPeriodProcessedForCashback(periodNumber, processedPeriods);
  
  // Filter completed inspections in this billing period
  const completedInspections = inspections.filter(inspection => 
    inspection.status === 'completed' && 
    isDateInBillingPeriod(
      new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
      period
    )
  );

  const totalRevenue = completedInspections.reduce((sum, inspection) => sum + inspection.price, 0);
  const totalCashback = totalRevenue * 0.15; // 15% for agents
  const totalCommission = totalRevenue * 0.30; // 30% for clerks - ALWAYS SHOWN (not processed)
  const netRevenue = totalRevenue - totalCashback - totalCommission; // 55% for company

  return {
    periodNumber,
    period,
    completedInspections,
    totalRevenue,
    totalCashback: isCashbackProcessed ? 0 : totalCashback, // Return 0 if cashback already processed
    totalCommission, // Always show commission - it's never processed/reset
    netRevenue,
    isProcessed: isCashbackProcessed // Only tracks cashback processing status
  };
}

/**
 * Calculate unprocessed cashback for current billing period
 */
export function calculateCurrentPeriodUnprocessedCashback(
  inspections: Inspection[],
  processedPeriods: ProcessedBillingPeriod[]
): CashbackCalculation {
  const currentPeriod = getCurrentBillingPeriod();
  return calculatePeriodCashback(currentPeriod.periodNumber, inspections, processedPeriods);
}

/**
 * Get agent cashback breakdown for a specific period (only if cashback unprocessed)
 */
export function getAgentCashbackBreakdown(
  periodNumber: number,
  inspections: Inspection[],
  users: User[],
  processedPeriods: ProcessedBillingPeriod[]
): AgentCashbackBreakdown[] {
  const isCashbackProcessed = isBillingPeriodProcessedForCashback(periodNumber, processedPeriods);
  
  if (isCashbackProcessed) {
    return []; // Return empty array if cashback is already processed
  }

  const period = getBillingPeriod(periodNumber);
  const periodInspections = inspections.filter(inspection => 
    inspection.status === 'completed' && 
    isDateInBillingPeriod(
      new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
      period
    )
  );

  // Group inspections by agent - use same field as invoice system
  const agentGroups = new Map<string, Inspection[]>();
  periodInspections.forEach(inspection => {
    if (inspection.agentId && !agentGroups.has(inspection.agentId)) {
      agentGroups.set(inspection.agentId, []);
    }
    if (inspection.agentId) {
      agentGroups.get(inspection.agentId)!.push(inspection);
    }
  });

  // Calculate cashback for each agent
  const breakdown: AgentCashbackBreakdown[] = [];
  agentGroups.forEach((agentInspections, agentId) => {
    const agent = users.find(u => u.id === agentId);
    const totalRevenue = agentInspections.reduce((sum, inspection) => sum + inspection.price, 0);
    const cashbackAmount = totalRevenue * 0.15;

    breakdown.push({
      agentId,
      agentName: agent?.name || 'Unknown Agent',
      inspections: agentInspections,
      totalRevenue,
      cashbackAmount
    });
  });

  return breakdown.sort((a, b) => b.cashbackAmount - a.cashbackAmount);
}

/**
 * Get clerk commission breakdown for a specific period (commissions are NEVER processed/reset)
 */
export function getClerkCommissionBreakdown(
  periodNumber: number,
  inspections: Inspection[],
  users: User[],
  processedPeriods: ProcessedBillingPeriod[]
): ClerkCommissionBreakdown[] {
  // Commission is never processed, so always return the breakdown

  const period = getBillingPeriod(periodNumber);
  const periodInspections = inspections.filter(inspection => 
    inspection.status === 'completed' && 
    inspection.clerkId && // Only inspections with assigned clerks
    isDateInBillingPeriod(
      new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
      period
    )
  );

  // Group inspections by clerk
  const clerkGroups = new Map<string, Inspection[]>();
  periodInspections.forEach(inspection => {
    if (inspection.clerkId) {
      if (!clerkGroups.has(inspection.clerkId)) {
        clerkGroups.set(inspection.clerkId, []);
      }
      clerkGroups.get(inspection.clerkId)!.push(inspection);
    }
  });

  // Calculate commission for each clerk
  const breakdown: ClerkCommissionBreakdown[] = [];
  clerkGroups.forEach((clerkInspections, clerkId) => {
    const clerk = users.find(u => u.id === clerkId);
    const totalRevenue = clerkInspections.reduce((sum, inspection) => sum + inspection.price, 0);
    const commissionAmount = totalRevenue * 0.30;

    breakdown.push({
      clerkId,
      clerkName: clerk?.name || 'Unknown Clerk',
      inspections: clerkInspections,
      totalRevenue,
      commissionAmount
    });
  });

  return breakdown.sort((a, b) => b.commissionAmount - a.commissionAmount);
}

/**
 * Create a processed billing period record for cashback only
 */
export function createProcessedBillingPeriod(
  calculation: CashbackCalculation,
  adminUserId: string,
  notes?: string
): ProcessedBillingPeriod {
  return {
    id: `PBP-${calculation.periodNumber}-${Date.now()}`,
    periodNumber: calculation.periodNumber,
    billingPeriodStart: calculation.period.start.toISOString(),
    billingPeriodEnd: calculation.period.end.toISOString(),
    totalRevenue: calculation.totalRevenue,
    totalCashbackProcessed: calculation.totalRevenue * 0.15, // Store actual cashback processed
    totalCommissionProcessed: 0, // Commission is never processed
    processedAt: new Date().toISOString(),
    processedBy: adminUserId,
    processedType: 'cashback', // Only processing cashback
    notes
  };
}

/**
 * Get all unprocessed billing periods with cashback
 */
export function getUnprocessedPeriodsWithCashback(
  inspections: Inspection[],
  processedPeriods: ProcessedBillingPeriod[],
  maxPeriods: number = 12
): CashbackCalculation[] {
  const currentPeriod = getCurrentBillingPeriod();
  const unprocessedPeriods: CashbackCalculation[] = [];

  for (let i = 0; i < maxPeriods; i++) {
    const periodNumber = currentPeriod.periodNumber - i;
    if (periodNumber > 0) {
      const calculation = calculatePeriodCashback(periodNumber, inspections, processedPeriods);
      
      // Only include periods with actual revenue and cashback to process
      if (!calculation.isProcessed && calculation.totalRevenue > 0) {
        unprocessedPeriods.push(calculation);
      }
    }
  }

  return unprocessedPeriods;
}

/**
 * Validate if cashback processing is allowed for a period
 */
export function validateCashbackProcessing(
  periodNumber: number,
  processedPeriods: ProcessedBillingPeriod[]
): { isValid: boolean; error?: string } {
  if (isBillingPeriodProcessedForCashback(periodNumber, processedPeriods)) {
    return {
      isValid: false,
      error: `Billing period #${periodNumber} has already been processed for cashback.`
    };
  }

  const currentPeriod = getCurrentBillingPeriod();
  if (periodNumber > currentPeriod.periodNumber) {
    return {
      isValid: false,
      error: `Cannot process future billing period #${periodNumber}.`
    };
  }

  return { isValid: true };
}

/**
 * Format processed billing period for display
 */
export function formatProcessedBillingPeriod(period: ProcessedBillingPeriod): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  
  const startStr = new Date(period.billingPeriodStart).toLocaleDateString('en-GB', formatOptions);
  const endStr = new Date(period.billingPeriodEnd).toLocaleDateString('en-GB', formatOptions);
  
  return `Period #${period.periodNumber}: ${startStr} - ${endStr}`;
}

/**
 * Calculate total unprocessed amounts across all periods
 * Note: Only cashback gets processed/reset, commission accumulates forever
 */
export function calculateTotalUnprocessedAmounts(
  inspections: Inspection[],
  processedPeriods: ProcessedBillingPeriod[]
): {
  totalRevenue: number;
  totalCashback: number; // Only unprocessed cashback
  totalCommission: number; // All commission (never processed)
  totalNetRevenue: number;
  periodCount: number;
} {
  const unprocessedCashbackPeriods = getUnprocessedPeriodsWithCashback(inspections, processedPeriods);
  const allPeriodsWithRevenue = getAllPeriodsWithRevenue(inspections, 12); // Get all periods for commission
  
  return {
    totalRevenue: unprocessedCashbackPeriods.reduce((sum, p) => sum + p.totalRevenue, 0),
    totalCashback: unprocessedCashbackPeriods.reduce((sum, p) => sum + p.totalCashback, 0), // Only unprocessed
    totalCommission: allPeriodsWithRevenue.reduce((sum, p) => sum + (p.totalRevenue * 0.30), 0), // All commission
    totalNetRevenue: unprocessedCashbackPeriods.reduce((sum, p) => sum + p.netRevenue, 0),
    periodCount: unprocessedCashbackPeriods.length
  };
}

/**
 * Get all periods with revenue (for commission calculation)
 */
function getAllPeriodsWithRevenue(
  inspections: Inspection[],
  maxPeriods: number = 12
): { periodNumber: number; totalRevenue: number }[] {
  const currentPeriod = getCurrentBillingPeriod();
  const periods: { periodNumber: number; totalRevenue: number }[] = [];

  for (let i = 0; i < maxPeriods; i++) {
    const periodNumber = currentPeriod.periodNumber - i;
    if (periodNumber > 0) {
      const period = getBillingPeriod(periodNumber);
      const completedInspections = inspections.filter(inspection => 
        inspection.status === 'completed' && 
        isDateInBillingPeriod(
          new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
          period
        )
      );

      const totalRevenue = completedInspections.reduce((sum, inspection) => sum + inspection.price, 0);
      
      if (totalRevenue > 0) {
        periods.push({ periodNumber, totalRevenue });
      }
    }
  }

  return periods;
}

/**
 * NEW AGENT-SPECIFIC CASHBACK PROCESSING FUNCTIONS
 */

/**
 * Check if an agent's cashback has been processed for a specific period
 */
export function isAgentCashbackProcessed(
  agentId: string,
  periodNumber: number,
  processedAgentCashbacks: ProcessedAgentCashback[]
): boolean {
  return processedAgentCashbacks.some(p => 
    p.agentId === agentId && p.periodNumber === periodNumber
  );
}

/**
 * Get all agents with unprocessed cashback - ALIGNED WITH INVOICE SYSTEM
 */
export function getAgentsWithUnprocessedCashback(
  inspections: Inspection[],
  users: User[],
  processedAgentCashbacks: ProcessedAgentCashback[],
  maxPeriods: number = 12
): AgentCashbackStatus[] {
  const currentPeriod = getCurrentBillingPeriod();
  const agentCashbackMap = new Map<string, AgentCashbackStatus>();

  // Initialize agents - using same logic as invoice system
  const agents = users.filter(u => u.role === 'agent');
  agents.forEach(agent => {
    agentCashbackMap.set(agent.id, {
      agentId: agent.id,
      agentName: agent.name || 'Unknown Agent', // Use same field as invoice system
      unprocessedCashback: 0,
      unprocessedRevenue: 0,
      unprocessedInspections: [],
      periodsWithCashback: []
    });
  });

  // Check each period for unprocessed cashback
  for (let i = 0; i < maxPeriods; i++) {
    const periodNumber = currentPeriod.periodNumber - i;
    if (periodNumber <= 0) continue;

    const period = getBillingPeriod(periodNumber);
    
    // Use SAME filtering logic as invoice system
    const periodInspections = inspections.filter(inspection => 
      inspection.status === 'completed' && 
      inspection.agentId && // Use agentId field like invoice system
      isDateInBillingPeriod(
        new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
        period
      )
    );

    // Group by agent and check if processed
    const agentInspections = new Map<string, Inspection[]>();
    periodInspections.forEach(inspection => {
      if (inspection.agentId) { // Use agentId field
        if (!agentInspections.has(inspection.agentId)) {
          agentInspections.set(inspection.agentId, []);
        }
        agentInspections.get(inspection.agentId)!.push(inspection);
      }
    });

    agentInspections.forEach((inspections, agentId) => {
      const isProcessed = isAgentCashbackProcessed(agentId, periodNumber, processedAgentCashbacks);
      
      if (!isProcessed) {
        // Use same calculation as invoice system
        const revenue = inspections.reduce((sum, inspection) => sum + inspection.price, 0);
        const cashback = revenue * 0.15;

        const agentStatus = agentCashbackMap.get(agentId);
        if (agentStatus) {
          agentStatus.unprocessedCashback += cashback;
          agentStatus.unprocessedRevenue += revenue;
          agentStatus.unprocessedInspections.push(...inspections);
          agentStatus.periodsWithCashback.push({
            periodNumber,
            period,
            inspections,
            revenue,
            cashback
          });
        }
      }
    });
  }

  // Return only agents with unprocessed cashback
  return Array.from(agentCashbackMap.values())
    .filter(agent => agent.unprocessedCashback > 0)
    .sort((a, b) => b.unprocessedCashback - a.unprocessedCashback);
}

/**
 * Create a processed agent cashback record
 */
export function createProcessedAgentCashback(
  agentStatus: AgentCashbackStatus,
  adminUserId: string,
  notes?: string
): ProcessedAgentCashback[] {
  return agentStatus.periodsWithCashback.map(periodData => ({
    id: `PAC-${agentStatus.agentId}-${periodData.periodNumber}-${Date.now()}`,
    agentId: agentStatus.agentId,
    agentName: agentStatus.agentName,
    periodNumber: periodData.periodNumber,
    billingPeriodStart: periodData.period.start.toISOString(),
    billingPeriodEnd: periodData.period.end.toISOString(),
    inspections: periodData.inspections,
    totalRevenue: periodData.revenue,
    cashbackAmount: periodData.cashback,
    processedAt: new Date().toISOString(),
    processedBy: adminUserId,
    notes: notes || `Cashback processed for ${agentStatus.agentName}`
  }));
}

/**
 * Validate if agent cashback processing is allowed
 */
export function validateAgentCashbackProcessing(
  agentId: string,
  processedAgentCashbacks: ProcessedAgentCashback[]
): { isValid: boolean; error?: string } {
  const agent = processedAgentCashbacks.find(p => p.agentId === agentId);
  
  if (!agentId) {
    return {
      isValid: false,
      error: 'Agent ID is required for cashback processing.'
    };
  }

  return { isValid: true };
}