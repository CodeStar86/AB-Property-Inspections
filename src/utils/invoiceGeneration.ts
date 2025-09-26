/**
 * Invoice generation utilities for 2-week billing periods
 */

import { 
  Invoice, 
  InvoiceLineItem, 
  Inspection, 
  Property, 
  User, 
  InvoiceStatus,
  ProcessedBillingPeriod
} from '../types';
import { 
  BillingPeriod, 
  getCurrentBillingPeriod, 
  getBillingPeriod, 
  isDateInBillingPeriod,
  formatBillingPeriod 
} from './billingPeriods';
import { 
  isBillingPeriodProcessed,
  validateCashbackProcessing
} from './cashbackProcessing';

export interface InvoiceGenerationData {
  inspections: Inspection[];
  properties: Property[];
  users: User[];
  processedBillingPeriods?: ProcessedBillingPeriod[];
}

/**
 * Generate invoice for a specific billing period (legacy - generates combined invoice)
 */
export function generateInvoiceForPeriod(
  period: BillingPeriod,
  data: InvoiceGenerationData
): Invoice | null {
  // Check if this period has already been processed for cashback
  if (data.processedBillingPeriods) {
    const validation = validateCashbackProcessing(period.periodNumber, data.processedBillingPeriods);
    if (!validation.isValid) {
      console.warn(`Invoice generation warning: ${validation.error}`);
      // Continue with generation but note that cashback was already processed
    }
  }
  // Filter completed inspections in this billing period
  const periodInspections = data.inspections.filter(inspection => 
    inspection.status === 'completed' && 
    isDateInBillingPeriod(
      new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
      period
    )
  );

  // Return null if no inspections to invoice
  if (periodInspections.length === 0) {
    return null;
  }

  // Calculate totals
  const totalAmount = periodInspections.reduce((sum, inspection) => sum + inspection.price, 0);
  const agentCashback = totalAmount * 0.15; // 15% for agents
  const clerkCommission = totalAmount * 0.30; // 30% for clerks
  const netAmount = totalAmount - agentCashback - clerkCommission;

  // Generate due date (30 days from period end)
  const dueDate = new Date(period.end);
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice: Invoice = {
    id: `INV-${period.periodNumber}-${Date.now()}`,
    agentId: 'COMBINED', // Mark as combined invoice for all agents
    billingPeriodStart: period.start.toISOString(),
    billingPeriodEnd: period.end.toISOString(),
    periodNumber: period.periodNumber,
    inspectionIds: periodInspections.map(i => i.id),
    totalAmount,
    agentCashback,
    clerkCommission,
    netAmount,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
    notes: `Combined invoice for billing period: ${formatBillingPeriod(period)}`
  };

  return invoice;
}

/**
 * Generate agent-specific invoice for a billing period
 */
export function generateAgentInvoiceForPeriod(
  period: BillingPeriod,
  agentId: string,
  data: InvoiceGenerationData
): Invoice | null {
  // Check if this period has already been processed for cashback
  if (data.processedBillingPeriods) {
    const validation = validateCashbackProcessing(period.periodNumber, data.processedBillingPeriods);
    if (!validation.isValid) {
      console.warn(`Invoice generation warning: ${validation.error}`);
      // Continue with generation but note that cashback was already processed
    }
  }
  // Filter completed inspections for this agent in this billing period
  const agentInspections = data.inspections.filter(inspection => 
    inspection.agentId === agentId &&
    inspection.status === 'completed' && 
    isDateInBillingPeriod(
      new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
      period
    )
  );

  // Return null if no inspections to invoice for this agent
  if (agentInspections.length === 0) {
    return null;
  }

  // Get agent name for invoice notes
  const agent = data.users.find(u => u.id === agentId);
  const agentName = agent?.name || 'Unknown Agent';

  // Calculate totals for this agent's inspections
  const totalAmount = agentInspections.reduce((sum, inspection) => sum + inspection.price, 0);
  const agentCashback = totalAmount * 0.15; // 15% for this agent
  const clerkCommission = totalAmount * 0.30; // 30% for clerks
  const netAmount = totalAmount - agentCashback - clerkCommission;

  // Generate due date (30 days from period end)
  const dueDate = new Date(period.end);
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice: Invoice = {
    id: `INV-${agentId.substring(0, 3).toUpperCase()}-${period.periodNumber}-${Date.now()}`,
    agentId,
    billingPeriodStart: period.start.toISOString(),
    billingPeriodEnd: period.end.toISOString(),
    periodNumber: period.periodNumber,
    inspectionIds: agentInspections.map(i => i.id),
    totalAmount,
    agentCashback,
    clerkCommission,
    netAmount,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
    notes: `Invoice for ${agentName} - Period: ${formatBillingPeriod(period)}`
  };

  return invoice;
}

/**
 * Generate invoices for all agents in a billing period
 */
export function generateAllAgentInvoicesForPeriod(
  period: BillingPeriod,
  data: InvoiceGenerationData
): Invoice[] {
  // Get all agents who have completed inspections in this period
  const agentsWithInspections = new Set(
    data.inspections
      .filter(inspection => 
        inspection.status === 'completed' && 
        isDateInBillingPeriod(
          new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate), 
          period
        )
      )
      .map(inspection => inspection.agentId)
  );

  const invoices: Invoice[] = [];

  // Generate invoice for each agent
  agentsWithInspections.forEach(agentId => {
    const agentInvoice = generateAgentInvoiceForPeriod(period, agentId, data);
    if (agentInvoice) {
      invoices.push(agentInvoice);
    }
  });

  return invoices;
}

/**
 * Generate line items for an invoice
 */
export function generateInvoiceLineItems(
  invoice: Invoice,
  data: InvoiceGenerationData
): InvoiceLineItem[] {
  return invoice.inspectionIds.map(inspectionId => {
    const inspection = data.inspections.find(i => i.id === inspectionId);
    const property = data.properties.find(p => p.id === inspection?.propertyId);
    const agent = data.users.find(u => u.id === inspection?.agentId);
    const clerk = data.users.find(u => u.id === inspection?.clerkId);

    if (!inspection || !property) {
      throw new Error(`Missing data for inspection ${inspectionId}`);
    }

    return {
      inspectionId: inspection.id,
      propertyAddress: property.address,
      inspectionType: inspection.inspectionType,
      completedDate: inspection.completedDate || inspection.completedAt || inspection.scheduledDate,
      agentName: agent?.name || 'Unknown Agent',
      clerkName: clerk?.name || 'Not Assigned',
      amount: inspection.price
    };
  });
}

/**
 * Auto-generate invoice for current period if not exists
 */
export function autoGenerateCurrentPeriodInvoice(
  existingInvoices: Invoice[],
  data: InvoiceGenerationData
): Invoice | null {
  const currentPeriod = getCurrentBillingPeriod();
  
  // Check if invoice already exists for current period
  const existingInvoice = existingInvoices.find(
    invoice => invoice.periodNumber === currentPeriod.periodNumber
  );

  if (existingInvoice) {
    return null; // Invoice already exists
  }

  return generateInvoiceForPeriod(currentPeriod, data);
}

/**
 * Generate invoice for a specific past period
 */
export function generatePastPeriodInvoice(
  periodNumber: number,
  existingInvoices: Invoice[],
  data: InvoiceGenerationData
): Invoice | null {
  // Check if invoice already exists
  const existingInvoice = existingInvoices.find(
    invoice => invoice.periodNumber === periodNumber
  );

  if (existingInvoice) {
    return null; // Invoice already exists
  }

  const period = getBillingPeriod(periodNumber);
  return generateInvoiceForPeriod(period, data);
}

/**
 * Calculate invoice summary statistics
 */
export function calculateInvoiceSummary(invoices: Invoice[]) {
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalPaid = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalOutstanding = invoices
    .filter(invoice => ['generated', 'sent', 'overdue'].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalOverdue = invoices
    .filter(invoice => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return {
    totalInvoices,
    totalAmount,
    totalPaid,
    totalOutstanding,
    totalOverdue,
    averageInvoiceAmount: totalInvoices > 0 ? totalAmount / totalInvoices : 0
  };
}

/**
 * Get invoices for a specific agent
 */
export function getAgentInvoices(agentId: string, invoices: Invoice[]): Invoice[] {
  return invoices.filter(invoice => invoice.agentId === agentId);
}

/**
 * Calculate agent-specific invoice summary
 */
export function calculateAgentInvoiceSummary(agentId: string, invoices: Invoice[]) {
  const agentInvoices = getAgentInvoices(agentId, invoices);
  return calculateInvoiceSummary(agentInvoices);
}

/**
 * Generate agent invoice for current period if not exists
 */
export function generateAgentCurrentPeriodInvoice(
  agentId: string,
  existingInvoices: Invoice[],
  data: InvoiceGenerationData
): Invoice | null {
  const currentPeriod = getCurrentBillingPeriod();
  
  // Check if invoice already exists for this agent in current period
  const existingInvoice = existingInvoices.find(
    invoice => invoice.agentId === agentId && invoice.periodNumber === currentPeriod.periodNumber
  );

  if (existingInvoice) {
    return null; // Invoice already exists
  }

  return generateAgentInvoiceForPeriod(currentPeriod, agentId, data);
}

/**
 * Update invoice status based on dates and actions
 */
export function updateInvoiceStatus(invoice: Invoice): InvoiceStatus {
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);

  // If already paid, keep as paid
  if (invoice.status === 'paid') {
    return 'paid';
  }

  // Check if overdue
  if (now > dueDate && invoice.status !== 'draft') {
    return 'overdue';
  }

  return invoice.status;
}

/**
 * Format invoice number for display
 */
export function formatInvoiceNumber(invoice: Invoice): string {
  return `AB-${invoice.periodNumber.toString().padStart(3, '0')}-${invoice.id.split('-').pop()?.substring(0, 6)}`;
}

/**
 * Get invoice status color for UI
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'generated':
      return 'bg-blue-100 text-blue-800';
    case 'sent':
      return 'bg-yellow-100 text-yellow-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}