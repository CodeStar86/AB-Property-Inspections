import React, { useState, useMemo } from 'react';
import { useApp, useUsers } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  PoundSterling,
  Building,
  Activity,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CreditCard
} from 'lucide-react';
import { User, Invoice } from '../../types';
import { getCurrentBillingPeriod, formatBillingPeriod, getBillingPeriod, getPastBillingPeriods, isDateInBillingPeriod } from '../../utils/billingPeriods';
import { 
  getAgentInvoices, 
  calculateAgentInvoiceSummary, 
  generateAgentCurrentPeriodInvoice,
  formatInvoiceNumber,
  getInvoiceStatusColor,
  updateInvoiceStatus
} from '../../utils/invoiceGeneration';

interface AgentPerformance {
  agentId: string;
  totalInspections: number;
  completedInspections: number;
  totalRevenue: number;
  cashbackEarned: number;
  currentPeriodCashback: number;
  propertiesManaged: number;
  averageRating: number;
  completionRate: number;
  recentActivity: string;
}

export function AgentManagement() {
  const { state, dispatch } = useApp();
  const { addUser, updateUser, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAgentDetail, setShowAgentDetail] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const currentPeriod = getCurrentBillingPeriod();

  // Get all agents
  const agents = state.users.filter(user => user.role === 'agent');

  // Calculate agent performance metrics
  const getAgentPerformance = (agentId: string): AgentPerformance => {
    const agentInspections = state.inspections.filter(i => i.agentId === agentId);
    const completedInspections = agentInspections.filter(i => i.status === 'completed');
    const totalRevenue = completedInspections.reduce((sum, i) => sum + i.price, 0);
    const cashbackEarned = totalRevenue * 0.15; // 15% cashback
    
    // Current period cashback
    const currentPeriodInspections = completedInspections.filter(i => {
      const inspectionDate = new Date(i.completedAt || i.scheduledDate);
      return inspectionDate >= currentPeriod.start && inspectionDate <= currentPeriod.end;
    });
    const currentPeriodRevenue = currentPeriodInspections.reduce((sum, i) => sum + i.price, 0);
    const currentPeriodCashback = currentPeriodRevenue * 0.15;

    const propertiesManaged = state.properties.filter(p => p.agentId === agentId).length;
    const completionRate = agentInspections.length > 0 
      ? (completedInspections.length / agentInspections.length) * 100 
      : 0;

    const lastInspection = agentInspections
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const recentActivity = lastInspection 
      ? `Last inspection ${new Date(lastInspection.createdAt).toLocaleDateString('en-GB')}`
      : 'No recent activity';

    return {
      agentId,
      totalInspections: agentInspections.length,
      completedInspections: completedInspections.length,
      totalRevenue,
      cashbackEarned,
      currentPeriodCashback,
      propertiesManaged,
      averageRating: 4.2 + Math.random() * 0.8, // Mock rating
      completionRate,
      recentActivity
    };
  };

  // Filter agents based on search and status
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && agent.isActive) ||
                           (statusFilter === 'inactive' && !agent.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);

  // Calculate summary statistics
  const agentStats = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.isActive).length;
    const totalRevenue = agents.reduce((sum, agent) => {
      const performance = getAgentPerformance(agent.id);
      return sum + performance.totalRevenue;
    }, 0);
    const totalCashback = totalRevenue * 0.15;
    const avgPerformance = agents.length > 0 
      ? agents.reduce((sum, agent) => sum + getAgentPerformance(agent.id).completionRate, 0) / agents.length
      : 0;

    return {
      totalAgents,
      activeAgents,
      totalRevenue,
      totalCashback,
      avgPerformance
    };
  }, [agents]);

  const handleInviteAgent = () => {
    if (!newAgentForm.name || !newAgentForm.email) {
      toast.error('Please fill in required fields');
      return;
    }

    const newAgent: User = {
      id: Date.now().toString(),
      name: newAgentForm.name,
      email: newAgentForm.email,
      role: 'agent',
      isActive: true,
      createdAt: new Date().toISOString(),
      phone: newAgentForm.phone || undefined,
      address: newAgentForm.address || undefined
    };

    dispatch({ type: 'ADD_USER', payload: newAgent });
    
    toast.success('Agent Invited Successfully!', {
      description: `${newAgent.name} has been added to the system and will receive an invitation email.`,
      duration: 4000,
    });

    setNewAgentForm({ name: '', email: '', phone: '', address: '' });
    setShowInviteDialog(false);
  };

  const toggleAgentStatus = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      try {
        await updateUser(agentId, { isActive: !agent.isActive });
        
        toast.success(`Agent ${!agent.isActive ? 'Activated' : 'Deactivated'}`, {
          description: `${agent.name} is now ${!agent.isActive ? 'active' : 'inactive'}.`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Error updating agent status:', error);
        toast.error('Failed to update agent status', {
          description: error instanceof Error ? error.message : 'Please try again.',
          duration: 4000,
        });
      }
    }
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;

    try {
      // Use the useUsers hook's deleteUser function
      await deleteUser(agentToDelete.id);

      toast.success('Agent deleted successfully', {
        description: `${agentToDelete.name} has been removed from the system.`,
        duration: 3000,
      });

      setShowDeleteConfirm(false);
      setAgentToDelete(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 4000,
      });
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
          <p className="text-gray-600 mt-1">Manage agents, track performance, and monitor cashback</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Agent</DialogTitle>
              <DialogDescription>
                Add a new agent to the AB Property Inspection Services platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newAgentForm.name}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter agent's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAgentForm.email}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter agent's email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newAgentForm.phone}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newAgentForm.address}
                  onChange={(e) => setNewAgentForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter agent's address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteAgent}>
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-xl font-bold text-gray-900">{agentStats.totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-xl font-bold text-gray-900">{agentStats.activeAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PoundSterling className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">£{agentStats.totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Cashback Paid</p>
                <p className="text-xl font-bold text-gray-900">£{agentStats.totalCashback.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className={`text-xl font-bold ${getPerformanceColor(agentStats.avgPerformance)}`}>
                  {agentStats.avgPerformance.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search agents by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agent List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const performance = getAgentPerformance(agent.id);
          
          return (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-xs">
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">{performance.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowAgentDetail(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Properties</p>
                    <p className="font-medium">{performance.propertiesManaged}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Inspections</p>
                    <p className="font-medium">{performance.totalInspections}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Completion Rate</p>
                    <p className={`font-medium ${getPerformanceColor(performance.completionRate)}`}>
                      {performance.completionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Cashback</p>
                    <p className="font-medium">£{performance.cashbackEarned.toFixed(0)}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Current Period Cashback</span>
                    <span className="text-lg font-bold text-blue-900">
                      £{performance.currentPeriodCashback.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{performance.recentActivity}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={agent.isActive ? 'destructive' : 'default'}
                      onClick={() => toggleAgentStatus(agent.id)}
                    >
                      {agent.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setAgentToDelete(agent);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by inviting your first agent to the platform.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Invite Agent
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Detail Dialog */}
      {selectedAgent && (
        <Dialog open={showAgentDetail} onOpenChange={setShowAgentDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(selectedAgent.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <span>{selectedAgent.name}</span>
                  <p className="text-sm text-gray-600 font-normal">{selectedAgent.email}</p>
                </div>
              </DialogTitle>
              <DialogDescription>
                View detailed performance metrics, financial tracking, and property management information for this agent.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto gap-1 p-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
                  <span className="sm:hidden">Info</span>
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="performance" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
                  <span className="sm:hidden">Perf</span>
                  <span className="hidden sm:inline">Performance</span>
                </TabsTrigger>
                <TabsTrigger value="cashback" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
                  <span className="sm:hidden">Money</span>
                  <span className="hidden sm:inline">Cashback</span>
                </TabsTrigger>
                <TabsTrigger value="invoices" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
                  <span className="sm:hidden">Bills</span>
                  <span className="hidden sm:inline">Invoices</span>
                </TabsTrigger>
                <TabsTrigger value="properties" className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
                  <span className="sm:hidden">Props</span>
                  <span className="hidden sm:inline">Properties</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-3 sm:space-y-4">
                {(() => {
                  const performance = getAgentPerformance(selectedAgent.id);
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Properties Managed</p>
                                <p className="text-lg sm:text-xl font-bold">{performance.propertiesManaged}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Total Inspections</p>
                                <p className="text-lg sm:text-xl font-bold">{performance.totalInspections}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-base sm:text-lg">Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="text-xs sm:text-sm text-green-800">Total Revenue Generated</p>
                              <p className="text-lg sm:text-2xl font-bold text-green-900">£{performance.totalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs sm:text-sm text-blue-800">Total Cashback Earned</p>
                              <p className="text-lg sm:text-2xl font-bold text-blue-900">£{performance.cashbackEarned.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <p className="text-xs sm:text-sm text-purple-800">Current Period</p>
                              <p className="text-lg sm:text-2xl font-bold text-purple-900">£{performance.currentPeriodCashback.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-3 sm:space-y-4">
                {(() => {
                  const performance = getAgentPerformance(selectedAgent.id);
                  const agentInspections = state.inspections.filter(i => i.agentId === selectedAgent.id);
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Completion Rate</p>
                                <p className={`text-lg sm:text-2xl font-bold ${getPerformanceColor(performance.completionRate)}`}>
                                  {performance.completionRate.toFixed(1)}%
                                </p>
                              </div>
                              <div className={`p-1.5 sm:p-2 rounded-lg ${
                                performance.completionRate >= 80 ? 'bg-green-100' :
                                performance.completionRate >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                {performance.completionRate >= 80 ? (
                                  <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                                ) : performance.completionRate >= 60 ? (
                                  <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-600" />
                                ) : (
                                  <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Average Rating</p>
                                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                                  {performance.averageRating.toFixed(1)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-0.5 sm:space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Award
                                    key={star}
                                    className={`h-3 sm:h-4 w-3 sm:w-4 ${
                                      star <= performance.averageRating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-base sm:text-lg">Recent Inspections</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 sm:space-y-3 max-h-60 overflow-y-auto">
                            {agentInspections
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .slice(0, 10)
                              .map((inspection) => {
                                const property = state.properties.find(p => p.id === inspection.propertyId);
                                return (
                                  <div key={inspection.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 rounded-lg space-y-1 sm:space-y-0">
                                    <div className="flex-1">
                                      <p className="text-xs sm:text-sm font-medium">{property?.address}</p>
                                      <p className="text-xs text-gray-600">
                                        {inspection.inspectionType.replace('_', ' ')} • {new Date(inspection.scheduledDate).toLocaleDateString('en-GB')}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:text-right space-x-2 sm:space-x-0">
                                      <Badge className={
                                        inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        inspection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }>
                                        {inspection.status}
                                      </Badge>
                                      <p className="text-xs sm:text-sm font-medium sm:mt-1">£{inspection.price}</p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="cashback" className="space-y-3 sm:space-y-4">
                {(() => {
                  const agentInspections = state.inspections.filter(i => i.agentId === selectedAgent.id && i.status === 'completed');
                  const currentPeriod = getCurrentBillingPeriod();
                  const pastPeriods = getPastBillingPeriods(12); // Last 12 periods
                  const allPeriods = [currentPeriod, ...pastPeriods].sort((a, b) => b.periodNumber - a.periodNumber);

                  // Calculate cashback for each period
                  const periodCashbackData = allPeriods.map(period => {
                    const periodInspections = agentInspections.filter(inspection => {
                      const inspectionDate = new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate);
                      return isDateInBillingPeriod(inspectionDate, period);
                    });

                    const totalRevenue = periodInspections.reduce((sum, inspection) => sum + inspection.price, 0);
                    const cashbackAmount = totalRevenue * 0.15; // 15% cashback

                    return {
                      period,
                      inspections: periodInspections,
                      totalRevenue,
                      cashbackAmount,
                      inspectionCount: periodInspections.length
                    };
                  }).filter(data => data.inspectionCount > 0); // Only show periods with inspections

                  const totalCashback = periodCashbackData.reduce((sum, data) => sum + data.cashbackAmount, 0);
                  const currentPeriodCashback = periodCashbackData.find(data => data.period.periodNumber === currentPeriod.periodNumber)?.cashbackAmount || 0;
                  const previousPeriodCashback = periodCashbackData.find(data => data.period.periodNumber === currentPeriod.periodNumber - 1)?.cashbackAmount || 0;
                  
                  const cashbackTrend = currentPeriodCashback > previousPeriodCashback ? 'up' : 
                                      currentPeriodCashback < previousPeriodCashback ? 'down' : 'same';
                  const trendPercentage = previousPeriodCashback > 0 
                    ? Math.abs(((currentPeriodCashback - previousPeriodCashback) / previousPeriodCashback) * 100)
                    : 0;

                  return (
                    <>
                      {/* Cashback Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Total Cashback</p>
                                <p className="text-lg sm:text-xl font-bold text-green-600">£{totalCashback.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">{periodCashbackData.length} period{periodCashbackData.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Current Period</p>
                                <p className="text-lg sm:text-xl font-bold text-blue-600">£{currentPeriodCashback.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Period #{currentPeriod.periodNumber}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                {cashbackTrend === 'up' && <ArrowUpRight className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />}
                                {cashbackTrend === 'down' && <ArrowDownRight className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />}
                                {cashbackTrend === 'same' && <Minus className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />}
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">Trend vs Last Period</p>
                                <p className={`text-lg sm:text-xl font-bold ${
                                  cashbackTrend === 'up' ? 'text-green-600' : 
                                  cashbackTrend === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {cashbackTrend === 'same' ? '0%' : `${trendPercentage.toFixed(1)}%`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {cashbackTrend === 'up' ? 'Increase' : cashbackTrend === 'down' ? 'Decrease' : 'No change'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Current Period Highlight */}
                      {currentPeriodCashback > 0 && (
                        <Card className="border-blue-200 bg-blue-50">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <span>Current Billing Period</span>
                              <Badge variant="secondary">Active</Badge>
                            </CardTitle>
                            <CardDescription>
                              {formatBillingPeriod(currentPeriod)} • Period #{currentPeriod.periodNumber}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const currentData = periodCashbackData.find(data => data.period.periodNumber === currentPeriod.periodNumber);
                              if (!currentData) return <p className="text-gray-500">No completed inspections this period</p>;

                              return (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-white rounded-lg">
                                      <p className="text-sm text-blue-800">Inspections</p>
                                      <p className="text-2xl font-bold text-blue-900">{currentData.inspectionCount}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg">
                                      <p className="text-sm text-blue-800">Revenue Generated</p>
                                      <p className="text-2xl font-bold text-blue-900">£{currentData.totalRevenue.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-lg">
                                      <p className="text-sm text-blue-800">Cashback Earned</p>
                                      <p className="text-2xl font-bold text-blue-900">£{currentData.cashbackAmount.toFixed(2)}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-3">Recent Inspections Contributing to Cashback</h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {currentData.inspections
                                        .sort((a, b) => new Date(b.completedDate || b.completedAt || b.scheduledDate).getTime() - new Date(a.completedDate || a.completedAt || a.scheduledDate).getTime())
                                        .map(inspection => {
                                          const property = state.properties.find(p => p.id === inspection.propertyId);
                                          const cashback = inspection.price * 0.15;
                                          
                                          return (
                                            <div key={inspection.id} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                                              <div>
                                                <p className="font-medium">{property?.address}</p>
                                                <p className="text-gray-600">
                                                  {inspection.inspectionType.replace('_', ' ')} • 
                                                  {new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate).toLocaleDateString('en-GB')}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-medium">£{inspection.price}</p>
                                                <p className="text-blue-600 font-medium">+£{cashback.toFixed(2)}</p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      )}

                      {/* Historical Cashback Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Cashback History by Billing Period</CardTitle>
                          <CardDescription>
                            Detailed breakdown of cashback earnings over the last 12 billing periods
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {periodCashbackData.map((data, index) => {
                              const isCurrent = data.period.periodNumber === currentPeriod.periodNumber;
                              const previousData = periodCashbackData[index + 1];
                              const changeFromPrevious = previousData 
                                ? data.cashbackAmount - previousData.cashbackAmount 
                                : 0;
                              const changePercentage = previousData && previousData.cashbackAmount > 0
                                ? (changeFromPrevious / previousData.cashbackAmount) * 100
                                : 0;

                              return (
                                <Card key={data.period.periodNumber} className={isCurrent ? 'border-blue-200 bg-blue-50' : ''}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                          <h4 className="font-medium">Period #{data.period.periodNumber}</h4>
                                          {isCurrent && (
                                            <Badge variant="secondary" className="text-xs">Current</Badge>
                                          )}
                                          {changeFromPrevious !== 0 && !isCurrent && (
                                            <Badge 
                                              variant="outline" 
                                              className={`text-xs ${
                                                changeFromPrevious > 0 ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                                              }`}
                                            >
                                              {changeFromPrevious > 0 ? '+' : ''}{changePercentage.toFixed(1)}%
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {formatBillingPeriod(data.period)}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-lg text-green-600">£{data.cashbackAmount.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600">{data.inspectionCount} inspection{data.inspectionCount !== 1 ? 's' : ''}</p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="font-medium text-gray-700">Revenue Generated</p>
                                        <p className="text-gray-600">£{data.totalRevenue.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-700">Cashback Rate</p>
                                        <p className="text-gray-600">15%</p>
                                      </div>
                                    </div>

                                    {/* Show inspection details for non-current periods (collapsed) */}
                                    {!isCurrent && data.inspections.length > 0 && (
                                      <details className="mt-3">
                                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                                          View {data.inspections.length} inspection{data.inspections.length !== 1 ? 's' : ''} details
                                        </summary>
                                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                          {data.inspections
                                            .sort((a, b) => new Date(b.completedDate || b.completedAt || b.scheduledDate).getTime() - new Date(a.completedDate || a.completedAt || a.scheduledDate).getTime())
                                            .map(inspection => {
                                              const property = state.properties.find(p => p.id === inspection.propertyId);
                                              const cashback = inspection.price * 0.15;
                                              
                                              return (
                                                <div key={inspection.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-xs">
                                                  <div>
                                                    <p className="font-medium">{property?.address}</p>
                                                    <p className="text-gray-600">
                                                      {inspection.inspectionType.replace('_', ' ')} • 
                                                      {new Date(inspection.completedDate || inspection.completedAt || inspection.scheduledDate).toLocaleDateString('en-GB')}
                                                    </p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="font-medium">£{inspection.price}</p>
                                                    <p className="text-green-600 font-medium">+£{cashback.toFixed(2)}</p>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      </details>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}

                            {periodCashbackData.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No cashback earned yet</p>
                                <p className="text-sm">Cashback is earned when inspections are completed</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="invoices" className="space-y-4">
                {(() => {
                  const agentInvoices = getAgentInvoices(selectedAgent.id, state.invoices);
                  const invoiceSummary = calculateAgentInvoiceSummary(selectedAgent.id, state.invoices);
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm text-gray-600">Total Invoices</p>
                                <p className="text-xl font-bold">{invoiceSummary.totalInvoices}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                              <PoundSterling className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-xl font-bold">£{invoiceSummary.totalAmount.toFixed(2)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Agent Invoices</h4>
                        <Button
                          size="sm"
                          onClick={() => {
                            const newInvoice = generateAgentCurrentPeriodInvoice(
                              selectedAgent.id,
                              state.invoices,
                              {
                                inspections: state.inspections,
                                properties: state.properties,
                                users: state.users
                              }
                            );
                            
                            if (newInvoice) {
                              dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
                              toast.success('Agent Invoice Generated!', {
                                description: `Invoice ${formatInvoiceNumber(newInvoice)} for £${newInvoice.totalAmount.toFixed(2)} has been created.`,
                                duration: 4000,
                              });
                            } else {
                              toast.info('No New Invoice Needed', {
                                description: 'No new completed inspections found for this agent in the current period.',
                                duration: 3000,
                              });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Generate Current Period
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {agentInvoices
                          .sort((a, b) => b.periodNumber - a.periodNumber)
                          .map((invoice) => {
                            const updatedStatus = updateInvoiceStatus(invoice);
                            
                            return (
                              <Card key={invoice.id}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h5 className="font-medium">Invoice {formatInvoiceNumber(invoice)}</h5>
                                        <Badge className={getInvoiceStatusColor(updatedStatus)}>
                                          {updatedStatus.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Period #{invoice.periodNumber}: {formatBillingPeriod({
                                          start: new Date(invoice.billingPeriodStart),
                                          end: new Date(invoice.billingPeriodEnd),
                                          periodNumber: invoice.periodNumber
                                        })}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">£{invoice.totalAmount.toFixed(2)}</p>
                                      <p className="text-xs text-gray-600">
                                        {invoice.inspectionIds.length} inspection{invoice.inspectionIds.length !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                    <div>
                                      <p className="font-medium text-gray-700">Agent Cashback</p>
                                      <p className="text-green-600 font-medium">£{invoice.agentCashback.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-700">Generated</p>
                                      <p className="text-gray-600">{new Date(invoice.generatedAt).toLocaleDateString('en-GB')}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-700">Due Date</p>
                                      <p className="text-gray-600">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500">
                                      {invoice.notes}
                                    </p>
                                    <div className="flex space-x-2">
                                      {updatedStatus === 'draft' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const updatedInvoice = { ...invoice, status: 'generated' as const };
                                            dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
                                          }}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Finalize
                                        </Button>
                                      )}
                                      {updatedStatus === 'generated' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const updatedInvoice = { 
                                              ...invoice, 
                                              status: 'sent' as const,
                                              sentAt: new Date().toISOString()
                                            };
                                            dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
                                          }}
                                        >
                                          <Mail className="h-4 w-4 mr-1" />
                                          Mark as Sent
                                        </Button>
                                      )}
                                      {['sent', 'overdue'].includes(updatedStatus) && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const updatedInvoice = { 
                                              ...invoice, 
                                              status: 'paid' as const,
                                              paidAt: new Date().toISOString()
                                            };
                                            dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
                                          }}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Mark as Paid
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        
                        {agentInvoices.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No invoices generated yet</p>
                            <p className="text-sm">Generate an invoice for this agent's completed inspections</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="properties" className="space-y-4">
                {(() => {
                  const agentProperties = state.properties.filter(p => p.agentId === selectedAgent.id);
                  
                  return (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {agentProperties.map((property) => {
                        const propertyInspections = state.inspections.filter(i => i.propertyId === property.id);
                        
                        return (
                          <Card key={property.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{property.address}</h4>
                                  <p className="text-sm text-gray-600">
                                    {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} • 
                                    {property.bedrooms === 0 ? ' Studio' : ` ${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Registered: {new Date(property.createdAt).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{propertyInspections.length}</p>
                                  <p className="text-xs text-gray-600">inspections</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      {agentProperties.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No properties registered yet</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {agentToDelete?.name}? This action cannot be undone and will permanently remove the agent from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setAgentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
            >
              Delete Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}