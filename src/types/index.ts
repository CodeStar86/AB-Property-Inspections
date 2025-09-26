// Core types for the Property Inspections Management App

export type UserRole = 'agent' | 'clerk' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  address?: string; // Company address for agents
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  firstLogin: boolean;
}

export type PropertyType = 
  | 'house' | 'flat' | 'maisonette' | 'penthouse' 
  | 'studio' | 'bedsit' | 'hmo' | 'commercial';

export type InspectionType = 'routine' | 'fire_safety' | 'check_in' | 'check_out';

export type InspectionStatus = 
  | 'scheduled' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

export interface Property {
  id: string;
  address: string;
  propertyType: PropertyType;
  bedrooms: number; // 0 for studio
  agentId: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  agentId: string;
  clerkId?: string;
  inspectionType: InspectionType;
  scheduledDate: string;
  status: InspectionStatus;
  price: number;
  notes?: string;
  completedAt?: string;
  completedDate?: string; // For billing period calculations
  createdAt: string;
}

export interface Room {
  id: string;
  inspectionId: string;
  name: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  notes?: string;
  photos: string[];
}

export interface FinancialRecord {
  id: string;
  userId: string;
  inspectionId: string;
  type: 'cashback' | 'commission';
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface MonthlyReset {
  id: string;
  month: string; // YYYY-MM format
  totalCashback: number;
  totalCommissions: number;
  resetAt: string;
}

export interface ProcessedBillingPeriod {
  id: string;
  periodNumber: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalRevenue: number;
  totalCashbackProcessed: number;
  totalCommissionProcessed: number;
  processedAt: string;
  processedBy: string; // admin user ID
  processedType: 'cashback' | 'commission' | 'both'; // What was processed in this operation
  notes?: string;
}

// New agent-specific cashback processing
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

export type InvoiceStatus = 'draft' | 'generated' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  agentId: string; // Associate invoice with specific agent
  billingPeriodStart: string;
  billingPeriodEnd: string;
  periodNumber: number;
  inspectionIds: string[];
  totalAmount: number;
  agentCashback: number; // 15% of total
  clerkCommission: number; // 30% of total
  netAmount: number; // Total minus agent cashback and clerk commission
  status: InvoiceStatus;
  generatedAt: string;
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
  notes?: string;
}

export interface InvoiceLineItem {
  inspectionId: string;
  propertyAddress: string;
  inspectionType: InspectionType;
  completedDate: string;
  agentName: string;
  clerkName: string;
  amount: number;
}

// Pricing settings interface for admin configuration
export interface PricingSettings {
  id: string;
  inspectionType: InspectionType;
  bedroomPricing: Record<number, number>; // bedroom count -> price
  lastUpdated: string;
  updatedBy: string; // admin user ID
}

// Default pricing structure based on bedrooms
export const DEFAULT_INSPECTION_PRICING: Record<InspectionType, Record<number, number>> = {
  routine: {
    0: 50, // Studio
    1: 75,
    2: 100,
    3: 125,
    4: 150,
    5: 175,
  },
  fire_safety: {
    0: 60,
    1: 85,
    2: 110,
    3: 135,
    4: 160,
    5: 185,
  },
  check_in: {
    0: 80,
    1: 105,
    2: 130,
    3: 155,
    4: 180,
    5: 205,
  },
  check_out: {
    0: 90,
    1: 115,
    2: 140,
    3: 165,
    4: 190,
    5: 215,
  },
};

// Legacy export for backward compatibility
export const INSPECTION_PRICING = DEFAULT_INSPECTION_PRICING;

export const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: 'house', label: 'House' },
  { value: 'flat', label: 'Flat' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'bedsit', label: 'Bedsit' },
  { value: 'hmo', label: 'HMO (House in Multiple Occupation)' },
  { value: 'commercial', label: 'Commercial Property' },
];

export const INSPECTION_TYPES: Array<{ value: InspectionType; label: string }> = [
  { value: 'routine', label: 'Routine Inspection' },
  { value: 'fire_safety', label: 'Fire & Safety Inspection' },
  { value: 'check_in', label: 'Check-In Inspection' },
  { value: 'check_out', label: 'Check-Out Inspection' },
];

export const BEDROOM_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Studio (0 bedrooms)' },
  { value: 1, label: '1 bedroom' },
  { value: 2, label: '2 bedrooms' },
  { value: 3, label: '3 bedrooms' },
  { value: 4, label: '4 bedrooms' },
  { value: 5, label: '5+ bedrooms' },
];