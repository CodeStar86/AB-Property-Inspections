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
  Filter,
  Award,
  Users
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ClerkDetailDialogProps {
  clerk: User | null;
  properties: Property[];
  inspections: Inspection[];
  allUsers: User[];
  isOpen: boolean;
  onClose: () => void;
}

export function ClerkDetailDialog({ 
  clerk, 
  properties, 
  inspections, 
  allUsers, 
  isOpen, 
  onClose 
}: ClerkDetailDialogProps) {
  const [inspectionFilter, setInspectionFilter] = useState('all');
  
  if (!clerk) return null;

  const clerkInspections = inspections.filter(i => i.clerkId === clerk.id);
  
  // Filter inspections
  const filteredInspections = inspectionFilter === 'all'
    ? clerkInspections
    : clerkInspections.filter(i => i.status === inspectionFilter);

  // Calculate metrics
  const completedInspections = clerkInspections.filter(i => i.status === 'completed');
  const pendingInspections = clerkInspections.filter(i => i.status !== 'completed');
  const totalRevenue = completedInspections.reduce((sum, i) => sum + i.price, 0);
  const totalCommissions = totalRevenue * 0.30;

  // Performance metrics
  const completionRate = clerkInspections.length > 0 
    ? (completedInspections.length / clerkInspections.length) * 100 
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
      commissions: monthInspections.reduce((sum, i) => sum + i.price, 0) * 0.30
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

  const generateClerkReport = (
    clerk: User,
    inspections: Inspection[],
    users: User[],
    metrics: {
      totalRevenue: number;
      totalCommissions: number;
      completionRate: number;
      monthlyData: any[];
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

    // Create comprehensive HTML report
    const reportContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clerk Report - ${clerk.name}</title>
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
        
        .clerk-info {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .clerk-details h2 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .clerk-details p {
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
        
        .inspection-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .inspection-header {
            display: flex;
            justify-content: between;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        
        .inspection-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .inspection-meta {
            color: #6b7280;
            font-size: 14px;
        }
        
        .inspection-stats {
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
            <p>Clerk Performance Report</p>
        </div>
        
        <div class="content">
            <div class="clerk-info">
                <div class="clerk-details">
                    <h2>${clerk.name}</h2>
                    <p>${clerk.email}</p>
                    <p><strong>Report Generated:</strong> ${reportDate}</p>
                    <p><strong>Member Since:</strong> ${formatDate(clerk.createdAt)}</p>
                </div>
                <div class="badges">
                    <span class="badge ${clerk.isActive ? 'badge-active' : 'badge-inactive'}">${clerk.isActive ? 'Active' : 'Inactive'}</span>
                    <span class="badge badge-role">Clerk</span>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #dbeafe; color: #1e40af;">📅</div>
                    <div class="metric-value">${inspections.length}</div>
                    <div class="metric-label">Total Inspections</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #dcfce7; color: #166534;">✅</div>
                    <div class="metric-value">${completedInspections.length}</div>
                    <div class="metric-label">Completed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #fef3c7; color: #d97706;">💷</div>
                    <div class="metric-value">£${metrics.totalRevenue.toFixed(0)}</div>
                    <div class="metric-label">Total Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background-color: #f3e8ff; color: #7c3aed;">📈</div>
                    <div class="metric-value">£${metrics.totalCommissions.toFixed(0)}</div>
                    <div class="metric-label">Commission Earned</div>
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
                            <span>Pending Inspections</span>
                            <strong>${pendingInspections.length}</strong>
                        </div>
                        <div class="metric-row">
                            <span>Commission Rate</span>
                            <strong>30%</strong>
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
                <h3 class="section-title">Inspection History</h3>
                ${inspections
                  .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                  .map(inspection => {
                    const property = properties.find(p => p.id === inspection.propertyId);
                    const agent = users.find(u => u.id === inspection.agentId);
                    
                    return `
                      <div class="inspection-item">
                          <div class="inspection-header">
                              <div>
                                  <div class="inspection-title">${property?.address}</div>
                                  <div class="inspection-meta">
                                      ${inspection.inspectionType.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
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
                                  <div class="stat-label">Agent</div>
                                  <div class="stat-value">${agent?.name || 'Not assigned'}</div>
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
            <p>Report ID: ${clerk.id}-${Date.now()} | Generated on: ${new Date().toLocaleString('en-GB')}</p>
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
    link.download = `Clerk_Report_${clerk.name.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
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
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold">{clerk.name}</h2>
                <p className="text-sm text-gray-600 truncate">{clerk.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <Badge variant={clerk.isActive ? "default" : "secondary"} className="text-xs">
                {clerk.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="text-xs">Clerk</Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm">
            View detailed performance metrics, commission tracking, and inspection management information for this clerk.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Inspections</p>
                  <p className="text-xl sm:text-2xl font-bold">{clerkInspections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold">{completedInspections.length}</p>
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
                  <p className="text-xs sm:text-sm text-gray-600">Total Commission Earned</p>
                  <p className="text-xl sm:text-2xl font-bold">£{totalCommissions.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 sm:grid-cols-4 h-auto gap-1 p-1 mb-4 bg-muted rounded-lg">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">Info</span>
              <span className="hidden sm:inline">Overview</span>
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
                      <span className="text-xs sm:text-sm text-gray-600">Pending Inspections</span>
                      <span className="text-sm sm:text-base font-medium">{pendingInspections.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Commission Rate</span>
                      <span className="text-sm sm:text-base font-medium">30%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Member Since</span>
                      <span className="text-sm sm:text-base font-medium">{formatDate(clerk.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base">Commission Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Total Commission</span>
                      <span className="text-sm sm:text-base font-medium">£{totalCommissions.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Average per Inspection</span>
                      <span className="text-sm sm:text-base font-medium">
                        £{completedInspections.length > 0 ? (totalCommissions / completedInspections.length).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Company Portion (70%)</span>
                      <span className="text-sm sm:text-base font-medium">£{(totalRevenue * 0.70).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {clerkInspections
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map(inspection => {
                        const property = properties.find(p => p.id === inspection.propertyId);
                        const agent = allUsers.find(u => u.id === inspection.agentId);
                        return (
                          <div key={inspection.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 border rounded-lg space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-medium">{property?.address}</p>
                              <p className="text-xs text-gray-600">
                                {inspection.inspectionType.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
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

            <TabsContent value="inspections" className="space-y-3 sm:space-y-4 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Inspection Management</h3>
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
                {filteredInspections.map(inspection => {
                  const property = properties.find(p => p.id === inspection.propertyId);
                  const agent = allUsers.find(u => u.id === inspection.agentId);
                  const commission = inspection.status === 'completed' ? inspection.price * 0.30 : 0;

                  return (
                    <Card key={inspection.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-1 sm:space-y-0">
                          <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-medium">{property?.address}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {inspection.inspectionType.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm sm:text-base font-medium">£{inspection.price}</p>
                            <p className="text-xs text-gray-500">Commission: £{commission.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Agent</p>
                            <p className="font-medium">{agent?.name || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Scheduled</p>
                            <p className="font-medium">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <Badge className={getStatusColor(inspection.status)} variant="secondary">
                              {inspection.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredInspections.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="font-medium text-gray-900 mb-2">No inspections found</h3>
                      <p className="text-gray-600">
                        {inspectionFilter !== 'all' 
                          ? 'Try adjusting your filter to see more results.'
                          : 'This clerk has not been assigned any inspections yet.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-3 sm:space-y-4 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Key Performance Indicators</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Completion Rate</span>
                        <span className="font-medium">{completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-purple h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(completionRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{completedInspections.length}</p>
                        <p className="text-xs text-green-800">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{pendingInspections.length}</p>
                        <p className="text-xs text-yellow-800">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
                      <Award className="h-4 w-4" />
                      <span>Performance Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Total Assignments</span>
                      <span className="text-sm sm:text-base font-medium">{clerkInspections.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm sm:text-base font-medium">{completionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Avg. Revenue per Inspection</span>
                      <span className="text-sm sm:text-base font-medium">
                        £{completedInspections.length > 0 ? (totalRevenue / completedInspections.length).toFixed(0) : '0'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-3 sm:space-y-4 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
                      <PoundSterling className="h-4 w-4" />
                      <span>Commission Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Total Revenue Generated</span>
                      <span className="text-sm sm:text-base font-medium">£{totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Total Commission Earned</span>
                      <span className="text-sm sm:text-base font-medium">£{totalCommissions.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 border rounded">
                      <span className="text-xs sm:text-sm text-gray-600">Company Portion (70%)</span>
                      <span className="text-sm sm:text-base font-medium">£{(totalRevenue * 0.70).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Monthly Breakdown</span>
                    </CardTitle>
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
          <Button onClick={() => generateClerkReport(clerk, clerkInspections, allUsers, {
            totalRevenue,
            totalCommissions,
            completionRate,
            monthlyData
          })}>
            Generate Report
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}