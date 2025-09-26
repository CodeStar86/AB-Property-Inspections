import React, { useState } from 'react';
import { User, Property, Inspection } from '../../types';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import {
  UserCheck,
  Building,
  Calendar,
  PoundSterling,
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Mail,
  Phone,
  Edit,
  BarChart3,
  FileText,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AgentDetailDialogProps {
  agent: User | null;
  properties: Property[];
  inspections: Inspection[];
  allUsers: User[];
  isOpen: boolean;
  onClose: () => void;
}

export function AgentDetailDialog({ 
  agent, 
  properties, 
  inspections, 
  allUsers, 
  isOpen, 
  onClose 
}: AgentDetailDialogProps) {
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [inspectionFilter, setInspectionFilter] = useState('all');
  
  if (!agent) return null;

  const agentProperties = properties.filter(p => p.agentId === agent.id);
  const agentInspections = inspections.filter(i => i.agentId === agent.id);
  
  // Filter properties
  const filteredProperties = propertyFilter === 'all' 
    ? agentProperties 
    : agentProperties.filter(p => p.propertyType === propertyFilter);

  // Filter inspections
  const filteredInspections = inspectionFilter === 'all'
    ? agentInspections
    : agentInspections.filter(i => i.status === inspectionFilter);

  // Calculate metrics
  const completedInspections = agentInspections.filter(i => i.status === 'completed');
  const pendingInspections = agentInspections.filter(i => i.status !== 'completed');
  const totalRevenue = completedInspections.reduce((sum, i) => sum + i.price, 0);
  const totalCashback = totalRevenue * 0.15;

  // Performance metrics
  const avgPropertyInspections = agentProperties.length > 0 
    ? agentInspections.length / agentProperties.length 
    : 0;
  
  const completionRate = agentInspections.length > 0 
    ? (completedInspections.length / agentInspections.length) * 100 
    : 0;

  // Monthly breakdown (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const monthInspections = completedInspections.filter(inspection => {
      const inspectionDate = new Date(inspection.completedAt || inspection.scheduledDate);
      const inspectionMonth = `${inspectionDate.getFullYear()}-${String(inspectionDate.getMonth() + 1).padStart(2, '0')}`;
      return inspectionMonth === monthKey;
    });
    
    return {
      month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      inspections: monthInspections.length,
      revenue: monthInspections.reduce((sum, i) => sum + i.price, 0),
      cashback: monthInspections.reduce((sum, i) => sum + i.price, 0) * 0.15
    };
  }).reverse();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const uniquePropertyTypes = [...new Set(agentProperties.map(p => p.propertyType))];

  const generateAgentReport = (
    agent: User,
    properties: Property[],
    inspections: Inspection[],
    users: User[],
    metrics: {
      totalRevenue: number;
      totalCashback: number;
      completionRate: number;
      avgPropertyInspections: number;
      monthlyData: any[];
      uniquePropertyTypes: string[];
    }
  ) => {
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const completedInspections = inspections.filter(i => i.status === 'completed');
    const pendingInspections = inspections.filter(i => i.status !== 'completed');

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 12px;';
        case 'in_progress': return 'background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 12px;';
        case 'assigned': return 'background-color: #f3e8ff; color: #7c3aed; padding: 4px 8px; border-radius: 6px; font-size: 12px;';
        case 'scheduled': return 'background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-size: 12px;';
        case 'cancelled': return 'background-color: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-size: 12px;';
        default: return 'background-color: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 12px;';
      }
    };

    // Create comprehensive HTML report that matches the screen layout
    const reportContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent Report - ${agent.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        
        .content {
            padding: 30px;
        }
        
        .agent-info {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .agent-details h2 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .agent-details p {
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .badges {
            display: flex;
            gap: 8px;
        }
        
        .badge {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-active {
            background-color: #dcfce7;
            color: #166534;
        }
        
        .badge-role {
            background-color: #e0e7ff;
            color: #3730a3;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .metric-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        
        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .metric-label {
            color: #6b7280;
            font-size: 14px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
        }
        
        .card-header {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .metric-row:last-child {
            margin-bottom: 0;
        }
        
        .property-item, .inspection-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .property-header, .inspection-header {
            display: flex;
            justify-content: between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .property-title, .inspection-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .property-meta, .inspection-meta {
            color: #6b7280;
            font-size: 14px;
        }
        
        .property-stats, .inspection-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            font-size: 14px;
        }
        
        .stat-label {
            color: #6b7280;
            margin-bottom: 2px;
        }
        
        .stat-value {
            font-weight: 600;
            color: #1f2937;
        }
        
        .status-badge {
            display: inline-block;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AB Property Inspection Services</h1>
            <p>Agent Performance Report</p>
        </div>
        
        <div class="content">
            <div class="agent-info">
                <div class="agent-details">
                    <h2>${agent.name}</h2>
                    <p>${agent.email}</p>
                    <p><strong>Report Generated:</strong> ${reportDate}</p>
                    <p><strong>Member Since:</strong> ${formatDate(agent.createdAt)}</p>
                </div>
                <div class="badges">
                    <span class="badge ${agent.isActive ? 'badge-active' : 'badge-inactive'}">${agent.isActive ? 'Active' : 'Inactive'}</span>
                    <span class="badge badge-role">Agent</span>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #dbeafe; color: #1e40af;">🏢</div>
                    <div class="metric-value">${properties.length}</div>
                    <div class="metric-label">Properties</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #dcfce7; color: #166534;">📅</div>
                    <div class="metric-value">${inspections.length}</div>
                    <div class="metric-label">Total Inspections</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #fef3c7; color: #d97706;">💷</div>
                    <div class="metric-value">£${metrics.totalRevenue.toFixed(0)}</div>
                    <div class="metric-label">Total Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #f3e8ff; color: #7c3aed;">📈</div>
                    <div class="metric-value">£${metrics.totalCashback.toFixed(0)}</div>
                    <div class="metric-label">Cashback Earned</div>
                </div>
            </div>
            
            <div class="section">
                <h3 class="section-title">Performance Metrics</h3>
                <div class="grid-2">
                    <div class="card">
                        <div class="card-header">Key Metrics</div>
                        <div class="metric-row">
                            <span>Completion Rate</span>
                            <strong>${metrics.completionRate.toFixed(1)}%</strong>
                        </div>
                        <div class="metric-row">
                            <span>Avg. Inspections per Property</span>
                            <strong>${metrics.avgPropertyInspections.toFixed(1)}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Pending Inspections</span>
                            <strong>${pendingInspections.length}</strong>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">Portfolio Breakdown</div>
                        ${metrics.uniquePropertyTypes.map(type => {
                          const count = properties.filter(p => p.propertyType === type).length;
                          const percentage = ((count / properties.length) * 100).toFixed(1);
                          return `
                            <div class="metric-row">
                                <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                <strong>${count} (${percentage}%)</strong>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3 class="section-title">Financial Overview</h3>
                <div class="grid-2">
                    <div class="card">
                        <div class="card-header">Revenue Summary</div>
                        <div class="metric-row">
                            <span>Total Revenue Generated</span>
                            <strong>£${metrics.totalRevenue.toFixed(2)}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Total Cashback Earned</span>
                            <strong>£${metrics.totalCashback.toFixed(2)}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Company Portion (85%)</span>
                            <strong>£${(metrics.totalRevenue * 0.85).toFixed(2)}</strong>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">Monthly Breakdown</div>
                        ${metrics.monthlyData.map(month => `
                            <div class="metric-row">
                                <span>${month.month}</span>
                                <div style="text-align: right;">
                                    <div><strong>£${month.revenue.toFixed(0)}</strong></div>
                                    <div style="font-size: 12px; color: #6b7280;">${month.inspections} inspections</div>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3 class="section-title">Properties Portfolio</h3>
                ${properties.map(property => {
                  const propertyInspections = inspections.filter(i => i.propertyId === property.id);
                  const propertyCompleted = propertyInspections.filter(i => i.status === 'completed').length;
                  const propertyRevenue = propertyInspections
                    .filter(i => i.status === 'completed')
                    .reduce((sum, i) => sum + i.price, 0);

                  return `
                    <div class="property-item">
                        <div class="property-header">
                            <div>
                                <div class="property-title">${property.address}</div>
                                <div class="property-meta">
                                    ${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} • 
                                    ${property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div class="property-title">£${propertyRevenue.toFixed(0)}</div>
                                <div style="font-size: 12px; color: #6b7280;">revenue</div>
                            </div>
                        </div>
                        <div class="property-stats">
                            <div>
                                <div class="stat-label">Inspections</div>
                                <div class="stat-value">${propertyInspections.length}</div>
                            </div>
                            <div>
                                <div class="stat-label">Completed</div>
                                <div class="stat-value">${propertyCompleted}</div>
                            </div>
                            <div>
                                <div class="stat-label">Registered</div>
                                <div class="stat-value">${formatDate(property.createdAt)}</div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
            
            <div class="section">
                <h3 class="section-title">Inspection History</h3>
                ${inspections
                  .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                  .map(inspection => {
                    const property = properties.find(p => p.id === inspection.propertyId);
                    const clerk = users.find(u => u.id === inspection.clerkId);
                    
                    return `
                      <div class="inspection-item">
                          <div class="inspection-header">
                              <div>
                                  <div class="inspection-title">${property?.address}</div>
                                  <div class="inspection-meta">
                                      ${inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </div>
                              </div>
                              <div style="display: flex; align-items: center; gap: 8px;">
                                  <span class="status-badge" style="${getStatusColor(inspection.status)}">
                                      ${inspection.status.replace('_', ' ')}
                                  </span>
                                  <strong>£${inspection.price}</strong>
                              </div>
                          </div>
                          <div class="inspection-stats">
                              <div>
                                  <div class="stat-label">Scheduled</div>
                                  <div class="stat-value">${formatDate(inspection.scheduledDate)}</div>
                              </div>
                              <div>
                                  <div class="stat-label">Clerk</div>
                                  <div class="stat-value">${clerk?.name || 'Not assigned'}</div>
                              </div>
                              <div>
                                  <div class="stat-label">Created</div>
                                  <div class="stat-value">${formatDate(inspection.createdAt)}</div>
                              </div>
                          </div>
                      </div>`;
                  }).join('')}
            </div>
        </div>
        
        <div class="footer">
            <p>This report was automatically generated by AB Property Inspection Services</p>
            <p>Report ID: ${agent.id}-${Date.now()} | Generated on: ${new Date().toLocaleString('en-GB')}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Create and download the HTML report
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Agent_Report_${agent.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] sm:h-[95vh] flex flex-col overflow-hidden p-0">
        <div className="flex flex-col h-full p-6">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold">{agent.name}</h2>
                <p className="text-sm text-gray-600 truncate">{agent.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <Badge variant={agent.isActive ? "default" : "secondary"} className="text-xs">
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="text-xs">Agent</Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm">
            View detailed performance metrics, financial tracking, and property management information for this agent.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Properties Managed</p>
                  <p className="text-xl sm:text-2xl font-bold">{agentProperties.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Inspections</p>
                  <p className="text-xl sm:text-2xl font-bold">{agentInspections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <PoundSterling className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Revenue Generated</p>
                  <p className="text-xl sm:text-2xl font-bold">£{totalRevenue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Cashback Earned</p>
                  <p className="text-xl sm:text-2xl font-bold">£{totalCashback.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 sm:grid-cols-5 h-auto gap-1 p-1 mb-4 bg-muted rounded-lg">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">Info</span>
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">Props</span>
              <span className="hidden sm:inline">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="inspections" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">Inspect</span>
              <span className="hidden sm:inline">Inspections</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">Perf</span>
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">Money</span>
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
            <TabsContent value="overview" className="space-y-3 sm:space-y-4 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Completion Rate</span>
                      <span className="text-sm sm:text-base font-medium">{completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Avg. Inspections per Property</span>
                      <span className="text-sm sm:text-base font-medium">{avgPropertyInspections.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Pending Inspections</span>
                      <span className="text-sm sm:text-base font-medium">{pendingInspections.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Member Since</span>
                      <span className="text-sm sm:text-base font-medium">{formatDate(agent.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base">Portfolio Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {uniquePropertyTypes.map(type => {
                      const count = agentProperties.filter(p => p.propertyType === type).length;
                      const percentage = ((count / agentProperties.length) * 100).toFixed(1);
                      return (
                        <div key={type} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-xs sm:text-sm text-gray-600 capitalize">{type}</span>
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className="text-sm sm:text-base font-medium">{count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {agentInspections
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map(inspection => {
                        const property = properties.find(p => p.id === inspection.propertyId);
                        const clerk = allUsers.find(u => u.id === inspection.clerkId);
                        return (
                          <div key={inspection.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 border rounded-lg space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-medium">{property?.address}</p>
                              <p className="text-xs text-gray-600">
                                {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                              <Badge className={getStatusColor(inspection.status)} variant="secondary">
                                {inspection.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs sm:text-sm font-medium">£{inspection.price}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-3 sm:space-y-4 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Properties Portfolio</h3>
                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Property Types</SelectItem>
                    {uniquePropertyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {filteredProperties.map(property => {
                  const propertyInspections = agentInspections.filter(i => i.propertyId === property.id);
                  const completedCount = propertyInspections.filter(i => i.status === 'completed').length;
                  const revenue = propertyInspections
                    .filter(i => i.status === 'completed')
                    .reduce((sum, i) => sum + i.price, 0);

                  return (
                    <Card key={property.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-1 sm:space-y-0">
                          <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-medium">{property.address}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} • 
                              {property.bedrooms === 0 ? ' Studio' : ` ${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm sm:text-base font-medium">£{revenue.toFixed(0)}</p>
                            <p className="text-xs text-gray-500">revenue</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600">Inspections</p>
                            <p className="font-medium">{propertyInspections.length}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-medium">{completedCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Registered</p>
                            <p className="text-xs sm:text-sm font-medium">{formatDate(property.createdAt)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredProperties.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Building className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No properties found</p>
                    <p className="text-xs sm:text-sm">Try adjusting the filter or add properties for this agent</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inspections" className="space-y-3 sm:space-y-4 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Inspection History</h3>
                <Select value={inspectionFilter} onValueChange={setInspectionFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inspections</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {filteredInspections
                  .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                  .map(inspection => {
                    const property = properties.find(p => p.id === inspection.propertyId);
                    const clerk = allUsers.find(u => u.id === inspection.clerkId);
                    
                    return (
                      <Card key={inspection.id}>
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <h4 className="text-sm sm:text-base font-medium">{property?.address}</h4>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                              <Badge className={getStatusColor(inspection.status)} variant="secondary">
                                {inspection.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm sm:text-base font-medium">£{inspection.price}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex justify-between sm:block">
                              <p className="text-gray-600">Scheduled</p>
                              <p className="font-medium">{formatDate(inspection.scheduledDate)}</p>
                            </div>
                            <div className="flex justify-between sm:block">
                              <p className="text-gray-600">Clerk</p>
                              <p className="font-medium">{clerk?.name || 'Not assigned'}</p>
                            </div>
                            <div className="flex justify-between sm:block">
                              <p className="text-gray-600">Created</p>
                              <p className="font-medium">{formatDate(inspection.createdAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                {filteredInspections.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Calendar className="h-8 sm:h-12 w-8 sm:w-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No inspections found</p>
                    <p className="text-xs sm:text-sm">Try adjusting the filter or schedule inspections for this agent</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-3 sm:space-y-4 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                      <span className="text-xs sm:text-sm">Completion Rate</span>
                      <span className="text-sm sm:text-base font-bold text-green-800">{completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                      <span className="text-xs sm:text-sm">Avg. Property Utilization</span>
                      <span className="text-sm sm:text-base font-bold text-blue-800">{avgPropertyInspections.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                      <span className="text-xs sm:text-sm">Revenue per Inspection</span>
                      <span className="text-sm sm:text-base font-bold text-purple-800">
                        £{agentInspections.length > 0 ? (totalRevenue / agentInspections.length).toFixed(0) : '0'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base">Portfolio Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Active Properties</span>
                      <span className="text-sm sm:text-base font-medium">{agentProperties.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Recent Activity</span>
                      <span className="text-sm sm:text-base font-medium">
                        {agentProperties.filter(p => 
                          agentInspections.some(i => 
                            i.propertyId === p.id && 
                            new Date(i.scheduledDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                          )
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Upcoming Inspections</span>
                      <span className="text-sm sm:text-base font-medium">
                        {agentInspections.filter(i => 
                          new Date(i.scheduledDate) > new Date() && 
                          i.status !== 'cancelled'
                        ).length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-3 sm:space-y-4 pb-6">
              {/* Mobile-first Financial Summary */}
              <div className="lg:hidden">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-xs text-green-600 mb-1">Total Revenue Generated</p>
                        <p className="text-base sm:text-lg font-bold text-green-800">£{totalRevenue.toFixed(0)}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-blue-600 mb-1">Total Cashback Earned</p>
                        <p className="text-base sm:text-lg font-bold text-blue-800">£{totalCashback.toFixed(0)}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <p className="text-xs text-purple-600 mb-1">Current Period</p>
                        <p className="text-base sm:text-lg font-bold text-purple-800">£0.00</p>
                      </div>
                    </div>
                    
                    {/* Mobile Monthly Breakdown */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Monthly Breakdown</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {monthlyData.slice(0, 3).map((month, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded text-xs">
                            <span>{month.month}</span>
                            <div className="text-right">
                              <p className="font-medium">£{month.revenue.toFixed(0)}</p>
                              <p className="text-gray-500">{month.inspections} inspections</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {monthlyData.length > 3 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          +{monthlyData.length - 3} more months available on desktop
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop Financial Summary */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Revenue Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm">Total Revenue Generated</span>
                      <span className="font-bold text-blue-800">£{totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                      <span className="text-sm">Total Cashback Earned</span>
                      <span className="font-bold text-green-800">£{totalCashback.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm">Company Portion (85%)</span>
                      <span className="font-bold text-gray-800">£{(totalRevenue * 0.85).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Monthly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {monthlyData.map((month, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                          <span className="text-sm">{month.month}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">£{month.revenue.toFixed(0)}</p>
                            <p className="text-xs text-gray-500">{month.inspections} inspections</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => generateAgentReport(agent, agentProperties, agentInspections, allUsers, {
            totalRevenue,
            totalCashback,
            completionRate,
            avgPropertyInspections,
            monthlyData,
            uniquePropertyTypes
          })}>
            Generate Report
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}