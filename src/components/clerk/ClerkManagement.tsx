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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
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
  Activity,
  BarChart3,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Award,
  Trash2,
  Shield,
  Settings
} from 'lucide-react';
import { User } from '../../types';
import { getCurrentBillingPeriod } from '../../utils/billingPeriods';
import { ClerkDetailDialog } from './ClerkDetailDialog';

interface ClerkPerformance {
  clerkId: string;
  totalInspections: number;
  completedInspections: number;
  totalCommissions: number;
  currentPeriodCommissions: number;
  averageRating: number;
  completionRate: number;
  recentActivity: string;
  assignedInspections: number;
  pendingInspections: number;
}

export function ClerkManagement() {
  const { state } = useApp();
  const { addUser, updateUser, deleteUser, reloadUsers } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedClerk, setSelectedClerk] = useState<User | null>(null);
  const [showClerkDetail, setShowClerkDetail] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingClerk, setEditingClerk] = useState<User | null>(null);
  const [newClerkForm, setNewClerkForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  const currentPeriod = getCurrentBillingPeriod();

  // Get all clerks
  const clerks = state.users.filter(user => user.role === 'clerk');

  // Calculate clerk performance metrics
  const getClerkPerformance = (clerkId: string): ClerkPerformance => {
    const clerkInspections = state.inspections.filter(i => i.clerkId === clerkId);
    const completedInspections = clerkInspections.filter(i => i.status === 'completed');
    const assignedInspections = clerkInspections.filter(i => i.status === 'assigned' || i.status === 'in_progress');
    const pendingInspections = clerkInspections.filter(i => i.status === 'scheduled');

    // Calculate total commissions (30% of completed inspection revenue)
    const totalRevenue = completedInspections.reduce((sum, i) => sum + i.price, 0);
    const totalCommissions = totalRevenue * 0.30; // 30% commission
    
    // Current period commissions
    const currentPeriodInspections = completedInspections.filter(i => {
      const inspectionDate = new Date(i.completedAt || i.scheduledDate);
      return inspectionDate >= currentPeriod.start && inspectionDate <= currentPeriod.end;
    });
    const currentPeriodRevenue = currentPeriodInspections.reduce((sum, i) => sum + i.price, 0);
    const currentPeriodCommissions = currentPeriodRevenue * 0.30;

    const completionRate = clerkInspections.length > 0 
      ? (completedInspections.length / clerkInspections.length) * 100 
      : 0;

    const lastInspection = clerkInspections
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const recentActivity = lastInspection 
      ? `Last inspection ${new Date(lastInspection.createdAt).toLocaleDateString('en-GB')}`
      : 'No recent activity';

    return {
      clerkId,
      totalInspections: clerkInspections.length,
      completedInspections: completedInspections.length,
      totalCommissions,
      currentPeriodCommissions,
      averageRating: 4.1 + Math.random() * 0.9, // Mock rating
      completionRate,
      recentActivity,
      assignedInspections: assignedInspections.length,
      pendingInspections: pendingInspections.length
    };
  };

  // Filter clerks based on search and status
  const filteredClerks = useMemo(() => {
    return clerks.filter(clerk => {
      const matchesSearch = clerk.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           clerk.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && clerk.isActive) ||
                           (statusFilter === 'inactive' && !clerk.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [clerks, searchTerm, statusFilter]);

  // Calculate summary statistics
  const clerkStats = useMemo(() => {
    const totalClerks = clerks.length;
    const activeClerks = clerks.filter(c => c.isActive).length;
    const totalCommissions = clerks.reduce((sum, clerk) => {
      const performance = getClerkPerformance(clerk.id);
      return sum + performance.totalCommissions;
    }, 0);
    const avgPerformance = clerks.length > 0 
      ? clerks.reduce((sum, clerk) => sum + getClerkPerformance(clerk.id).completionRate, 0) / clerks.length
      : 0;

    const totalAssignedInspections = clerks.reduce((sum, clerk) => {
      return sum + getClerkPerformance(clerk.id).assignedInspections;
    }, 0);

    return {
      totalClerks,
      activeClerks,
      totalCommissions,
      avgPerformance,
      totalAssignedInspections
    };
  }, [clerks]);

  const handleAddClerk = async () => {
    if (!newClerkForm.name || !newClerkForm.email || !newClerkForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    if (state.users.some(u => u.email === newClerkForm.email)) {
      toast.error('A user with this email already exists');
      return;
    }

    try {
      console.log('Creating clerk with credentials:', {
        name: newClerkForm.name,
        email: newClerkForm.email,
        role: 'clerk',
        phone: newClerkForm.phone,
        address: newClerkForm.address,
        hasPassword: !!newClerkForm.password
      });
      
      const newClerk = await addUser({
        name: newClerkForm.name,
        email: newClerkForm.email,
        password: newClerkForm.password,
        role: 'clerk',
        phone: newClerkForm.phone || undefined,
        address: newClerkForm.address || undefined,
      });
      
      console.log('Clerk created successfully:', newClerk);
      
      // Reload users to ensure the new clerk appears in the list
      try {
        console.log('Reloading users to refresh the list...');
        await reloadUsers();
      } catch (reloadError) {
        console.error('Error reloading users after creation:', reloadError);
      }
      
      toast.success('Clerk Added Successfully!', {
        description: `${newClerk.name} has been added. Share these login credentials: Email: ${newClerkForm.email} | Password: ${newClerkForm.password}`,
        duration: 8000,
      });

      setNewClerkForm({ name: '', email: '', phone: '', address: '', password: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error creating clerk:', error);
      toast.error('Failed to create clerk', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 4000,
      });
    }
  };

  const handleEditClerk = async () => {
    if (!editingClerk || !editingClerk.name || !editingClerk.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if email already exists for other users
    if (state.users.some(u => u.email === editingClerk.email && u.id !== editingClerk.id)) {
      toast.error('A user with this email already exists');
      return;
    }

    try {
      await updateUser(editingClerk.id, {
        name: editingClerk.name,
        email: editingClerk.email,
        phone: editingClerk.phone,
        address: editingClerk.address,
      });
      
      toast.success('Clerk Updated Successfully!', {
        description: `${editingClerk.name}'s details have been updated.`,
        duration: 3000,
      });

      setEditingClerk(null);
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating clerk:', error);
      toast.error('Failed to update clerk', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 4000,
      });
    }
  };

  const handleDeleteClerk = async (clerkId: string) => {
    const clerk = clerks.find(c => c.id === clerkId);
    if (!clerk) return;

    // Check if clerk has assigned inspections
    const assignedInspections = state.inspections.filter(i => i.clerkId === clerkId);
    if (assignedInspections.length > 0) {
      toast.error('Cannot delete clerk with assigned inspections', {
        description: 'Please reassign or complete all inspections first.',
      });
      return;
    }

    try {
      await deleteUser(clerkId);
      
      toast.success('Clerk Deleted', {
        description: `${clerk.name} has been removed from the system.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting clerk:', error);
      toast.error('Failed to delete clerk', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 4000,
      });
    }
  };

  const toggleClerkStatus = async (clerkId: string) => {
    const clerk = clerks.find(c => c.id === clerkId);
    if (clerk) {
      try {
        await updateUser(clerkId, { isActive: !clerk.isActive });
        
        toast.success(`Clerk ${!clerk.isActive ? 'Activated' : 'Deactivated'}`, {
          description: `${clerk.name} is now ${!clerk.isActive ? 'active' : 'inactive'}.`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Error updating clerk status:', error);
        toast.error('Failed to update clerk status', {
          description: error instanceof Error ? error.message : 'Please try again.',
          duration: 4000,
        });
      }
    }
  };

  const openEditDialog = (clerk: User) => {
    setEditingClerk({ ...clerk });
    setShowEditDialog(true);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleReloadUsers = async () => {
    try {
      console.log('Manual reload users requested...');
      await reloadUsers();
      toast.success('Users reloaded successfully', {
        description: `Found ${state.users.length} total users`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error reloading users:', error);
      toast.error('Failed to reload users', {
        description: error instanceof Error ? error.message : 'Please try again.',
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clerk Management</h2>
          <p className="text-gray-600 mt-1">Manage clerks, track performance, and monitor commissions</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-gray-500">Total users: {state.users.length} | Clerks: {clerks.length}</p>
            <Button size="sm" variant="outline" onClick={handleReloadUsers}>
              <Shield className="h-3 w-3 mr-1" />
              Reload
            </Button>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Clerk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Clerk</DialogTitle>
              <DialogDescription>
                Create a new clerk account with login credentials. You must provide these credentials to the clerk for system access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newClerkForm.name}
                  onChange={(e) => setNewClerkForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter clerk's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClerkForm.email}
                  onChange={(e) => setNewClerkForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter clerk's email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newClerkForm.password}
                  onChange={(e) => setNewClerkForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Set login password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newClerkForm.phone}
                  onChange={(e) => setNewClerkForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newClerkForm.address}
                  onChange={(e) => setNewClerkForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter clerk's address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClerk}>
                Add Clerk
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
                <p className="text-sm font-medium text-gray-600">Total Clerks</p>
                <p className="text-xl font-bold text-gray-900">{clerkStats.totalClerks}</p>
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
                <p className="text-sm font-medium text-gray-600">Active Clerks</p>
                <p className="text-xl font-bold text-gray-900">{clerkStats.activeClerks}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-xl font-bold text-gray-900">£{clerkStats.totalCommissions.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Assigned Tasks</p>
                <p className="text-xl font-bold text-gray-900">{clerkStats.totalAssignedInspections}</p>
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
                <p className={`text-xl font-bold ${getPerformanceColor(clerkStats.avgPerformance)}`}>
                  {clerkStats.avgPerformance.toFixed(1)}%
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
                  placeholder="Search clerks by name or email..."
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
                <SelectItem value="all">All Clerks</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clerk List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClerks.map((clerk) => {
          const performance = getClerkPerformance(clerk.id);
          
          return (
            <Card key={clerk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(clerk.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{clerk.name}</h3>
                      <p className="text-sm text-gray-600">{clerk.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={clerk.isActive ? 'default' : 'secondary'} className="text-xs">
                          {clerk.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">{performance.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClerk(clerk);
                        setShowClerkDetail(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(clerk)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Inspections</p>
                    <p className="font-medium">{performance.totalInspections}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Completed</p>
                    <p className="font-medium">{performance.completedInspections}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Completion Rate</p>
                    <p className={`font-medium ${getPerformanceColor(performance.completionRate)}`}>
                      {performance.completionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Commissions</p>
                    <p className="font-medium">£{performance.totalCommissions.toFixed(0)}</p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">Current Period Commission</span>
                    <span className="text-lg font-bold text-purple-900">
                      £{performance.currentPeriodCommissions.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{performance.recentActivity}</p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={clerk.isActive ? 'destructive' : 'default'}
                      onClick={() => toggleClerkStatus(clerk.id)}
                    >
                      {clerk.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Clerk</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {clerk.name}? This action cannot be undone.
                            The clerk must have no assigned inspections to be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClerk(clerk.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredClerks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-900 mb-2">No clerks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first clerk to the platform.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Clerk
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Clerk Dialog */}
      {editingClerk && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Clerk Details</DialogTitle>
              <DialogDescription>
                Update clerk information and login credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editingClerk.name}
                  onChange={(e) => setEditingClerk(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter clerk's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingClerk.email}
                  onChange={(e) => setEditingClerk(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="Enter clerk's email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editingClerk.phone || ''}
                  onChange={(e) => setEditingClerk(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editingClerk.address || ''}
                  onChange={(e) => setEditingClerk(prev => prev ? { ...prev, address: e.target.value } : null)}
                  placeholder="Enter clerk's address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditClerk}>
                Update Clerk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Clerk Detail Dialog */}
      <ClerkDetailDialog
        clerk={selectedClerk}
        properties={state.properties}
        inspections={state.inspections}
        allUsers={state.users}
        isOpen={showClerkDetail}
        onClose={() => setShowClerkDetail(false)}
      />
    </div>
  );
}