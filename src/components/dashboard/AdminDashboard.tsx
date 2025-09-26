import React, { useState } from 'react';
import { useApp, useInspections, useUsers, useAdmin } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  Building, 
  Calendar, 
  PoundSterling,
  TrendingUp,
  Activity,
  UserCheck,
  MapPin,
  CheckCircle,
  Clock,
  FileText,
  UserPlus,
  Filter,
  Search,
  RotateCcw,
  Home,
  Briefcase,
  XCircle,
  Trash2,
  Database,
  AlertTriangle,
  Banknote
} from 'lucide-react';
import { InvoiceManagement } from '../invoice/InvoiceManagement';
import { AgentManagement } from '../agent/AgentManagement';
import { AgentDetailDialog } from '../agent/AgentDetailDialog';
import { ClerkManagement } from '../clerk/ClerkManagement';
import { PricingManagement } from '../pricing/PricingManagement';
import { PeriodOverview } from '../common/PeriodOverview';
import { CashbackManagement } from '../cashback/CashbackManagement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { calculateTotalUnprocessedAmounts } from '../../utils/cashbackProcessing';

export function AdminDashboard() {
  const { state } = useApp();
  const { updateInspection } = useInspections();
  const { updateUser } = useUsers();
  const { clearAllProperties, removeUnauthorizedAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [inspectionFilter, setInspectionFilter] = useState('all');
  const [inspectionSearch, setInspectionSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAgentDetailOpen, setIsAgentDetailOpen] = useState(false);
  const [selectedClerkForRejected, setSelectedClerkForRejected] = useState<{[inspectionId: string]: string}>({});
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
  // Calculate system statistics
  const totalUsers = state.users.length;
  const activeUsers = state.users.filter(u => u.isActive).length;
  const totalProperties = state.properties.length;
  const totalInspections = state.inspections.length;
  const completedInspections = state.inspections.filter(i => i.status === 'completed').length;
  const pendingInspections = state.inspections.filter(i => i.status === 'scheduled').length;
  const rejectedInspections = state.inspections.filter(i => i.status === 'rejected').length;
  
  // Calculate financial overview (only unprocessed amounts)
  const unprocessedAmounts = calculateTotalUnprocessedAmounts(
    state.inspections,
    state.processedBillingPeriods
  );
  const totalRevenue = state.inspections
    .filter(i => i.status === 'completed')
    .reduce((sum, i) => sum + i.price, 0);
  const totalCashback = unprocessedAmounts.totalCashback; // Only unprocessed cashback
  const totalCommissions = unprocessedAmounts.totalCommission; // Only unprocessed commissions
  const netRevenue = unprocessedAmounts.totalNetRevenue; // Only unprocessed net revenue

  // User breakdown by role
  const usersByRole = {
    agents: state.users.filter(u => u.role === 'agent').length,
    clerks: state.users.filter(u => u.role === 'clerk').length,
    admins: state.users.filter(u => u.role === 'admin' && u.email === 'r.depala86@gmail.com').length,
  };

  // Recent activity
  const recentInspections = state.inspections
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = state.users.find(u => u.id === userId);
      if (user) {
        await updateUser(userId, { isActive: !user.isActive });
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const assignClerkToInspection = async (inspectionId: string, clerkId: string) => {
    try {
      const inspection = state.inspections.find(i => i.id === inspectionId);
      const clerk = state.users.find(u => u.id === clerkId);
      
      if (inspection && clerk) {
        await updateInspection(inspectionId, {
          clerkId: clerkId,
          status: (inspection.status === 'scheduled' || inspection.status === 'rejected') ? 'assigned' : inspection.status
        });
        toast.success(`Clerk ${clerk.name} assigned to inspection successfully`);
      }
    } catch (error) {
      console.error('Error assigning clerk:', error);
      toast.error('Failed to assign clerk');
    }
  };

  const unassignClerkFromInspection = async (inspectionId: string) => {
    try {
      const inspection = state.inspections.find(i => i.id === inspectionId);
      
      if (inspection) {
        await updateInspection(inspectionId, {
          clerkId: undefined,
          status: inspection.status === 'assigned' ? 'scheduled' : inspection.status
        });
        toast.success('Clerk unassigned from inspection');
      }
    } catch (error) {
      console.error('Error unassigning clerk:', error);
      toast.error('Failed to unassign clerk');
    }
  };

  const reassignRejectedInspection = async (inspectionId: string) => {
    try {
      await updateInspection(inspectionId, {
        status: 'scheduled' as const,
        clerkId: undefined
      });
      toast.success('Inspection has been reassigned and is now available for clerks');
    } catch (error) {
      console.error('Error reassigning inspection:', error);
      toast.error('Failed to reassign inspection');
    }
  };

  const openAgentDetail = (agentId: string) => {
    setSelectedAgent(agentId);
    setIsAgentDetailOpen(true);
  };

  const closeAgentDetail = () => {
    setSelectedAgent(null);
    setIsAgentDetailOpen(false);
  };

  const handleClearAllProperties = async () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }

    try {
      const response = await clearAllProperties();
      if (response?.success) {
        toast.success(`Successfully cleared ${response.deletedCounts.properties} properties, ${response.deletedCounts.inspections} inspections, ${response.deletedCounts.financialRecords} financial records, and ${response.deletedCounts.invoices} invoices`);
        setIsConfirmingClear(false);
      }
    } catch (error) {
      console.error('Error clearing properties:', error);
      toast.error('Failed to clear properties: ' + (error as Error).message);
      setIsConfirmingClear(false);
    }
  };

  const cancelClearProperties = () => {
    setIsConfirmingClear(false);
  };

  const handleRemoveUnauthorizedAdmin = async () => {
    try {
      const response = await removeUnauthorizedAdmin();
      if (response?.success) {
        toast.success('Unauthorized admin user removed successfully');
      }
    } catch (error) {
      console.error('Error removing unauthorized admin:', error);
      toast.error('Failed to remove unauthorized admin: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateSystemReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      systemStats: {
        totalUsers,
        activeUsers,
        totalProperties,
        totalInspections,
        completedInspections,
        pendingInspections,
        rejectedInspections
      },
      financials: {
        totalRevenue: totalRevenue.toFixed(2),
        totalCashback: totalCashback.toFixed(2),
        totalCommissions: totalCommissions.toFixed(2),
        netRevenue: netRevenue.toFixed(2)
      },
      userDistribution: usersByRole,
      recentInspections: recentInspections
    };

    // Create downloadable report
    const reportContent = `
PROPERTY INSPECTION SERVICES - SYSTEM REPORT
Generated: ${new Date().toLocaleString('en-GB')}

=== SYSTEM OVERVIEW ===
Total Users: ${totalUsers} (${activeUsers} active)
Total Properties: ${totalProperties}
Total Inspections: ${totalInspections}
- Completed: ${completedInspections}
- Pending: ${pendingInspections}
- Rejected: ${rejectedInspections}

=== FINANCIAL SUMMARY ===
Total Revenue: £${totalRevenue.toFixed(2)}
Agent Cashback (15%): £${totalCashback.toFixed(2)}
Clerk Commissions (30%): £${totalCommissions.toFixed(2)}
Net Revenue (55%): £${netRevenue.toFixed(2)}

=== USER DISTRIBUTION ===
Agents: ${usersByRole.agents}
Clerks: ${usersByRole.clerks}
Admins: ${usersByRole.admins}

=== RECENT INSPECTIONS ===
${recentInspections.map(inspection => {
  const property = state.properties.find(p => p.id === inspection.propertyId);
  return `- ${property?.address || 'Unknown Property'} | Status: ${inspection.status} | Date: ${inspection.scheduledDate}`;
}).join('\n')}
    `.trim();

    // Download as text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('System report generated and downloaded');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed to top */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">System overview and management controls</p>
          </div>

        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-auto px-3 py-3 sm:px-6 sm:py-4">

        {/* System Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="p-1.5 bg-blue-100 rounded-lg mb-2 sm:mb-0 w-fit">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="sm:ml-3">
                  <p className="text-xs font-medium text-gray-600">Active Users</p>
                  <p className="text-lg font-bold text-gray-900">{activeUsers}</p>
                  <p className="text-xs text-gray-500">{activeUsers} active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="p-1.5 bg-green-100 rounded-lg mb-2 sm:mb-0 w-fit">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                <div className="sm:ml-3">
                  <p className="text-xs font-medium text-gray-600">Properties</p>
                  <p className="text-lg font-bold text-gray-900">{totalProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="p-1.5 bg-purple-100 rounded-lg mb-2 sm:mb-0 w-fit">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="sm:ml-3">
                  <p className="text-xs font-medium text-gray-600">Inspections</p>
                  <p className="text-lg font-bold text-gray-900">{totalInspections}</p>
                  <p className="text-xs text-gray-500">{completedInspections} completed{rejectedInspections > 0 ? `, ${rejectedInspections} rejected` : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="p-1.5 bg-yellow-100 rounded-lg mb-2 sm:mb-0 w-fit">
                  <PoundSterling className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="sm:ml-3">
                  <p className="text-xs font-medium text-gray-600">Revenue</p>
                  <p className="text-lg font-bold text-gray-900">£{totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Net: £{netRevenue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Financial Overview */}
        <Card className="mb-4">
          <CardHeader className="pb-3 px-3 pt-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <TrendingUp className="h-4 w-4" />
              <span>Financial Overview</span>
            </CardTitle>
            <CardDescription className="text-xs">Revenue breakdown and commission tracking</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-800">Total Revenue</p>
                <p className="text-base font-bold text-blue-900">£{totalRevenue.toFixed(0)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs font-medium text-green-800">Agent Cashback (15%)</p>
                <p className="text-base font-bold text-green-900">£{totalCashback.toFixed(0)}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xs font-medium text-purple-800">Clerk Commission (30%)</p>
                <p className="text-base font-bold text-purple-900">£{totalCommissions.toFixed(0)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-800">Net Revenue (55%)</p>
                <p className="text-base font-bold text-gray-900">£{netRevenue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-2 sm:px-3 py-2 flex-shrink-0">
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="flex w-max min-w-full p-1 gap-1 sm:gap-2 bg-muted/30">
              <TabsTrigger 
                value="overview" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <Home className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <Users className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="clerks" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <UserCheck className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="invoices" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <FileText className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="cashback" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <Banknote className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="pricing" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <PoundSterling className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="portfolios" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <Briefcase className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200 hidden md:flex"
              >
                <Users className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="inspections" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200 hidden lg:flex"
              >
                <CheckCircle className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="rejected" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200 hidden lg:flex"
              >
                <XCircle className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="properties" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200 hidden xl:flex"
              >
                <Building className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="periods" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <Clock className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger 
                value="data-management" 
                className="p-3 sm:p-2 min-w-[44px] sm:min-w-auto bg-transparent border-0 shadow-none data-[state=active]:bg-gradient-purple data-[state=active]:text-white transition-all duration-200"
              >
                <Database className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Mobile More Menu - Only for tabs hidden on smallest screens */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-16 h-8 text-xs bg-transparent border-0 shadow-none focus:ring-0 focus:ring-offset-0">
                <span className="font-bold">More</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="inspections">Inspections</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="properties">Properties</SelectItem>
                <SelectItem value="cashback">Cashback</SelectItem>
                <SelectItem value="periods">Periods</SelectItem>
                <SelectItem value="data-management">Data Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Agents</span>
                    <span className="text-sm text-gray-600">{usersByRole.agents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Clerks</span>
                    <span className="text-sm text-gray-600">{usersByRole.clerks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Admins</span>
                    <span className="text-sm text-gray-600">{usersByRole.admins}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest inspection activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInspections.map((inspection) => {
                    const property = state.properties.find(p => p.id === inspection.propertyId);
                    const agent = state.users.find(u => u.id === inspection.agentId);
                    
                    return (
                      <div key={inspection.id} className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-medium">{agent?.name}</p>
                          <p className="text-gray-600">{property?.address}</p>
                        </div>
                        <Badge className={getStatusColor(inspection.status)} variant="secondary">
                          {inspection.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <AgentManagement />
        </TabsContent>

        <TabsContent value="clerks">
          <ClerkManagement />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="cashback">
          <CashbackManagement />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingManagement />
        </TabsContent>

        <TabsContent value="periods">
          <PeriodOverview showPastPeriods={true} userRole="admin" />
        </TabsContent>

        <TabsContent value="portfolios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Agent Portfolios</span>
              </CardTitle>
              <CardDescription>
                Properties and inspections grouped by agent for better portfolio overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(() => {
                  const agents = state.users.filter(u => u.role === 'agent');
                  
                  if (agents.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No agents found</p>
                        <p className="text-sm">Add agents to see their portfolios</p>
                      </div>
                    );
                  }

                  return agents.map((agent) => {
                    const agentProperties = state.properties.filter(p => p.agentId === agent.id);
                    const agentInspections = state.inspections.filter(i => i.agentId === agent.id);
                    const completedInspections = agentInspections.filter(i => i.status === 'completed');
                    const pendingInspections = agentInspections.filter(i => i.status !== 'completed');
                    
                    const totalRevenue = completedInspections.reduce((sum, i) => sum + i.price, 0);
                    const totalCashback = totalRevenue * 0.15;

                    return (
                      <Card key={agent.id} className="overflow-hidden">
                        <CardHeader className="bg-blue-50 border-b">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{agent.name}</CardTitle>
                                <p className="text-sm text-gray-600">{agent.email}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                                    {agent.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant="outline">Agent</Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Total Portfolio Value</p>
                              <p className="text-xl font-bold text-green-600">£{totalRevenue.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">Cashback: £{totalCashback.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6">
                          {/* Portfolio Summary */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                              <Building className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 sm:mb-2 text-gray-600" />
                              <p className="text-xs sm:text-sm text-gray-600">Properties</p>
                              <p className="text-lg sm:text-xl font-bold">{agentProperties.length}</p>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 sm:mb-2 text-blue-600" />
                              <p className="text-xs sm:text-sm text-blue-600">Total Inspections</p>
                              <p className="text-lg sm:text-xl font-bold">{agentInspections.length}</p>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 sm:mb-2 text-green-600" />
                              <p className="text-xs sm:text-sm text-green-600">Completed</p>
                              <p className="text-lg sm:text-xl font-bold">{completedInspections.length}</p>
                            </div>
                            <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 sm:mb-2 text-yellow-600" />
                              <p className="text-xs sm:text-sm text-yellow-600">Pending</p>
                              <p className="text-lg sm:text-xl font-bold">{pendingInspections.length}</p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openAgentDetail(agent.id)}
                              className="flex items-center space-x-1 text-xs"
                            >
                              <Activity className="h-3 w-3" />
                              <span>View Details</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleUserStatus(agent.id)}
                              className={`flex items-center space-x-1 text-xs ${
                                agent.isActive 
                                  ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                                  : 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                              }`}
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>{agent.isActive ? 'Deactivate' : 'Activate'}</span>
                            </Button>
                          </div>

                          {/* Recent Properties */}
                          {agentProperties.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Properties</h4>
                              <div className="space-y-2">
                                {agentProperties.slice(0, 3).map((property) => {
                                  const propertyInspections = agentInspections.filter(i => i.propertyId === property.id);
                                  const latestInspection = propertyInspections
                                    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];
                                  
                                  return (
                                    <div key={property.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{property.address}</p>
                                        <p className="text-xs text-gray-600">
                                          {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`} • {property.propertyType}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-500">{propertyInspections.length} inspections</p>
                                        {latestInspection && (
                                          <Badge size="sm" className={getStatusColor(latestInspection.status)}>
                                            {latestInspection.status}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {agentProperties.length > 3 && (
                                  <p className="text-xs text-gray-500 text-center">
                                    +{agentProperties.length - 3} more properties
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {agentProperties.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No properties registered yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>Manage all system users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                    <p className="text-sm">Users will appear here once they register</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {state.users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{user.name}</h3>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Joined: {formatDate(user.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {user.role !== 'admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserStatus(user.id)}
                                className={user.isActive ? 'hover:bg-red-50' : 'hover:bg-green-50'}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                            {user.role === 'agent' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAgentDetail(user.id)}
                              >
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>All Inspections</span>
              </CardTitle>
              <CardDescription>Complete overview of all property inspections</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by address, agent, or clerk..."
                      value={inspectionSearch}
                      onChange={(e) => setInspectionSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={inspectionFilter} onValueChange={setInspectionFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Inspections</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {(() => {
                  let filteredInspections = state.inspections;

                  // Apply status filter
                  if (inspectionFilter !== 'all') {
                    filteredInspections = filteredInspections.filter(i => i.status === inspectionFilter);
                  }

                  // Apply search filter
                  if (inspectionSearch) {
                    const searchLower = inspectionSearch.toLowerCase();
                    filteredInspections = filteredInspections.filter(inspection => {
                      const property = state.properties.find(p => p.id === inspection.propertyId);
                      const agent = state.users.find(u => u.id === inspection.agentId);
                      const clerk = state.users.find(u => u.id === inspection.clerkId);
                      
                      return (
                        property?.address.toLowerCase().includes(searchLower) ||
                        agent?.name.toLowerCase().includes(searchLower) ||
                        clerk?.name.toLowerCase().includes(searchLower) ||
                        inspection.inspectionType.toLowerCase().includes(searchLower)
                      );
                    });
                  }

                  if (filteredInspections.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No inspections found matching your criteria</p>
                        <p className="text-sm">Try adjusting your search or filter settings</p>
                      </div>
                    );
                  }

                  return filteredInspections.map((inspection) => {
                    const property = state.properties.find(p => p.id === inspection.propertyId);
                    const agent = state.users.find(u => u.id === inspection.agentId);
                    const clerk = state.users.find(u => u.id === inspection.clerkId);
                    
                    return (
                      <div key={inspection.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600">
                              {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(inspection.status)}>
                              {inspection.status.replace('_', ' ')}
                            </Badge>
                            {!inspection.clerkId && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-700">Agent</p>
                            <p className="text-gray-600 truncate">{agent?.name}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Date</p>
                            <p className="text-gray-600">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Price</p>
                            <p className="text-gray-600">£{inspection.price}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Property Type</p>
                            <p className="text-gray-600">{property?.propertyType}</p>
                          </div>
                        </div>

                        {/* Clerk Assignment */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-700">Assigned Clerk:</p>
                            {clerk ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {clerk.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                Unassigned
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Unassign Clerk */}
                            {clerk && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unassignClerkFromInspection(inspection.id)}
                                className="text-xs text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Unassign
                              </Button>
                            )}

                            {/* Assign Available Clerks for unassigned inspections */}
                            {!inspection.clerkId && (
                              <div className="flex items-center space-x-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-xs">
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      Assign Clerk
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-56">
                                    <div className="space-y-1">
                                      {(() => {
                                        const availableClerks = state.users.filter(u => u.role === 'clerk' && u.isActive);
                                        return availableClerks.map(clerk => (
                                          <Button
                                            key={clerk.id}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start h-auto p-2"
                                            onClick={() => assignClerkToInspection(inspection.id, clerk.id)}
                                          >
                                            <div className="flex items-center space-x-2">
                                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                              <span className="text-sm">{clerk.name}</span>
                                            </div>
                                          </Button>
                                        ));
                                      })()}
                                      {(() => {
                                        const availableClerks = state.users.filter(u => u.role === 'clerk' && u.isActive);
                                        if (availableClerks.length === 0) {
                                          return <p className="text-sm text-muted-foreground p-2">No clerks available</p>;
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            )}

                            {/* Change Assignment for already assigned inspections */}
                            {(() => {
                              const availableClerks = state.users.filter(u => u.role === 'clerk' && u.isActive);
                              if (clerk && availableClerks.length > 0) {
                                return (
                                  <div className="flex items-center space-x-2">
                                    <Select onValueChange={(clerkId) => assignClerkToInspection(inspection.id, clerkId)}>
                                      <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-transparent">
                                        <RotateCcw className="h-4 w-4 text-gray-600 hover:text-gray-800" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableClerks.map(availableClerk => (
                                          <SelectItem key={availableClerk.id} value={availableClerk.id}>
                                            <div className="flex items-center space-x-2">
                                              <div className={`w-2 h-2 rounded-full ${
                                                availableClerk.id === clerk.id ? 'bg-blue-500' : 'bg-green-500'
                                              }`}></div>
                                              <span>{availableClerk.name}</span>
                                              {availableClerk.id === clerk.id && (
                                                <span className="text-xs text-gray-500">(current)</span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {(() => {
                              const availableClerks = state.users.filter(u => u.role === 'clerk' && u.isActive);
                              if (availableClerks.length === 0) {
                                return (
                                  <Badge variant="outline" className="text-gray-500">
                                    No clerks available
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Rejected Inspections</span>
              </CardTitle>
              <CardDescription>Inspections rejected by clerks that need reassignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const rejectedInspections = state.inspections.filter(i => i.status === 'rejected');
                  
                  if (rejectedInspections.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-500">No rejected inspections at the moment</p>
                        <p className="text-sm text-gray-400">All inspections are currently assigned or completed</p>
                      </div>
                    );
                  }
                  
                  return rejectedInspections.map((inspection) => {
                    const property = state.properties.find(p => p.id === inspection.propertyId);
                    const agent = state.users.find(u => u.id === inspection.agentId);
                    
                    return (
                      <div key={inspection.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            Rejected
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-700">Agent</p>
                            <p className="text-gray-600">{agent?.name}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Scheduled Date</p>
                            <p className="text-gray-600">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Price</p>
                            <p className="text-gray-600">£{inspection.price}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-orange-200">
                          <p className="text-sm text-orange-700">This inspection was rejected and needs to be reassigned to another clerk</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reassignRejectedInspection(inspection.id)}
                            className="bg-white hover:bg-orange-50 border-orange-300"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reassign
                          </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>All Properties</span>
              </CardTitle>
              <CardDescription>Complete list of all registered properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.properties.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No properties registered yet</p>
                    <p className="text-sm">Properties will appear here once agents register them</p>
                  </div>
                ) : (
                  state.properties.map((property) => {
                    const agent = state.users.find(u => u.id === property.agentId);
                    const propertyInspections = state.inspections.filter(i => i.propertyId === property.id);
                    const completedInspections = propertyInspections.filter(i => i.status === 'completed');
                    
                    return (
                      <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property.address}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bedrooms`} • {property.propertyType}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              {propertyInspections.length} inspection{propertyInspections.length !== 1 ? 's' : ''}
                            </Badge>
                            {completedInspections.length > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                {completedInspections.length} completed
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>Agent: {agent?.name}</span>
                          <span className="mx-2">•</span>
                          <span>Registered: {formatDate(property.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-management">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
              <CardDescription>
                Manage system data and perform maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-900">{state.properties.length}</p>
                    <p className="text-sm font-medium text-blue-700">Properties</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-900">{state.inspections.length}</p>
                    <p className="text-sm font-medium text-purple-700">Inspections</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-900">{state.financialRecords.length}</p>
                    <p className="text-sm font-medium text-green-700">Financial Records</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-900">{state.invoices.length}</p>
                    <p className="text-sm font-medium text-yellow-700">Invoices</p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Clear All Properties</h4>
                      <p className="text-sm text-red-700 mb-4">
                        This will permanently delete all properties, inspections, financial records, and invoices. 
                        This action cannot be undone.
                      </p>
                      
                      {!isConfirmingClear ? (
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={handleClearAllProperties}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Properties
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-red-800">
                            Are you absolutely sure? This will delete:
                          </p>
                          <ul className="text-sm text-red-700 space-y-1 ml-4">
                            <li>• {state.properties.length} properties</li>
                            <li>• {state.inspections.length} inspections</li>
                            <li>• {state.financialRecords.length} financial records</li>
                            <li>• {state.invoices.length} invoices</li>
                          </ul>
                          <div className="flex space-x-3">
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={handleClearAllProperties}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Yes, Delete Everything
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={cancelClearProperties}
                              className="border-gray-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Unauthorized Admin */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Remove Unauthorized Admin</h4>
                      <p className="text-sm text-red-700 mb-4">
                        Remove the unauthorized admin user (rahuldepala4ever@gmail.com) from the system.
                      </p>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveUnauthorizedAdmin}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Remove Unauthorized Admin
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Data Export */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Data Export</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Export system data for backup or analysis purposes.
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={generateSystemReport}
                    className="bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate System Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agent Detail Dialog */}
      <AgentDetailDialog
        agent={selectedAgent ? state.users.find(u => u.id === selectedAgent) || null : null}
        properties={state.properties}
        inspections={state.inspections}
        allUsers={state.users}
        isOpen={isAgentDetailOpen}
        onClose={closeAgentDetail}
      />
    </div>
  );
}