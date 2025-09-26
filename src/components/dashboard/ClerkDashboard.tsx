import React, { useState } from 'react';
import { useApp, useInspections } from '../../context/AppContext';
import { getCurrentBillingPeriod, isDateInBillingPeriod } from '../../utils/billingPeriods';
import { RealTimePeriodDisplay } from '../common/RealTimePeriodDisplay';
import { calculateCurrentPeriodUnprocessedCashback } from '../../utils/cashbackProcessing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { InspectionCompletionForm } from '../inspection/InspectionCompletionForm';
import { InspectionReport } from '../inspection/InspectionReport';
import { 
  CheckCircle, 
  Clock, 
  PoundSterling, 
  MapPin,
  Calendar,
  User,
  AlertCircle,
  X,
  FileText,
  Eye
} from 'lucide-react';

export function ClerkDashboard() {
  const { state } = useApp();
  const { updateInspection } = useInspections();
  const currentUser = state.currentUser!;
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // Filter inspections for clerk (only scheduled inspections without assigned clerk)
  const availableInspections = state.inspections.filter(i => 
    i.status === 'scheduled' && !i.clerkId
  );
  const assignedInspections = state.inspections.filter(i => 
    i.clerkId === currentUser.id
  );
  const completedReports = assignedInspections.filter(i => 
    i.status === 'completed'
  );
  
  // Calculate statistics
  const completedInspections = assignedInspections.filter(i => i.status === 'completed').length;
  const inProgressInspections = assignedInspections.filter(i => i.status === 'in_progress').length;
  
  // Get current billing period for commission calculation
  const currentBillingPeriod = getCurrentBillingPeriod();
  
  // Calculate unprocessed commission (30% of completed inspections in current billing period)
  const currentPeriodCashback = calculateCurrentPeriodUnprocessedCashback(
    assignedInspections, // Only clerk's inspections
    state.processedBillingPeriods
  );
  
  const currentPeriodInspections = assignedInspections
    .filter(i => i.status === 'completed')
    .filter(i => isDateInBillingPeriod(new Date(i.completedDate || i.scheduledDate), currentBillingPeriod));
  
  const currentPeriodEarnings = currentPeriodInspections.reduce((sum, i) => sum + i.price, 0);
  const clerkCommissionAmount = currentPeriodEarnings * 0.30; // Clerk's share of unprocessed commission
  const commissionAmount = currentPeriodCashback.isProcessed ? 0 : clerkCommissionAmount;

  const handleAcceptInspection = async (inspectionId: string) => {
    try {
      await updateInspection(inspectionId, {
        clerkId: currentUser.id,
        status: 'assigned' as const,
      });
    } catch (error) {
      console.error('Error accepting inspection:', error);
    }
  };

  const handleRejectInspection = async (inspectionId: string) => {
    try {
      await updateInspection(inspectionId, {
        status: 'rejected' as const,
        clerkId: undefined, // Remove clerk assignment if any
      });
    } catch (error) {
      console.error('Error rejecting inspection:', error);
    }
  };

  const handleStartInspection = (inspectionId: string) => {
    setSelectedInspectionId(inspectionId);
    setIsInspectionDialogOpen(true);
  };

  const handleCloseInspectionDialog = () => {
    setIsInspectionDialogOpen(false);
    setSelectedInspectionId(null);
  };

  const handleViewReport = (inspectionId: string) => {
    setViewingReportId(inspectionId);
    setIsReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setIsReportDialogOpen(false);
    setViewingReportId(null);
  };

  const handleCompleteInspection = async (inspectionId: string) => {
    try {
      await updateInspection(inspectionId, {
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        completedDate: new Date().toISOString(), // For billing calculations
      });
    } catch (error) {
      console.error('Error completing inspection:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If inspection dialog is open, render fullscreen inspection form
  if (isInspectionDialogOpen && selectedInspectionId) {
    const selectedInspection = state.inspections.find(i => i.id === selectedInspectionId);
    if (selectedInspection) {
      return (
        <InspectionCompletionForm
          inspection={selectedInspection}
          onClose={handleCloseInspectionDialog}
        />
      );
    }
  }

  // If report dialog is open, render fullscreen inspection report
  if (isReportDialogOpen && viewingReportId) {
    const selectedInspection = state.inspections.find(i => i.id === viewingReportId);
    const property = selectedInspection ? state.properties.find(p => p.id === selectedInspection.propertyId) : null;
    const agent = selectedInspection ? state.users.find(u => u.id === selectedInspection.agentId) : null;
    
    if (selectedInspection && property && agent) {
      // Create mock inspection data for the report
      // In a real app, this would be stored in the database when the inspection is completed
      const mockInspectionData = {
        sections: [], // This would be populated from stored inspection data
        formData: {
          overallNotes: selectedInspection.notes || '',
          recommendations: '',
          inspectorName: currentUser.name || 'Unknown Inspector'
        }
      };

      return (
        <InspectionReport
          inspection={selectedInspection}
          property={property}
          agent={agent}
          inspectionData={mockInspectionData}
          onBack={handleCloseReportDialog}
        />
      );
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clerk Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your assigned inspections and track earnings</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{availableInspections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{assignedInspections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedInspections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PoundSterling className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Commission</p>
                <p className="text-2xl font-bold text-gray-900">£{commissionAmount.toFixed(2)}</p>
                <div className="mt-1">
                  <RealTimePeriodDisplay compact={true} showIcon={false} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0 h-auto sm:h-10 p-1">
          <TabsTrigger value="available" className="text-sm sm:text-base py-3 sm:py-2 px-3 sm:px-4 min-h-[44px] sm:min-h-auto">
            <span className="sm:hidden">Available</span>
            <span className="hidden sm:inline">Available Inspections</span>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="text-sm sm:text-base py-3 sm:py-2 px-3 sm:px-4 min-h-[44px] sm:min-h-auto">
            <span className="sm:hidden">My Tasks</span>
            <span className="hidden sm:inline">My Inspections</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-sm sm:text-base py-3 sm:py-2 px-3 sm:px-4 min-h-[44px] sm:min-h-auto">
            <span className="sm:hidden">Reports</span>
            <span className="hidden sm:inline">Inspection Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Inspections</CardTitle>
              <CardDescription>
                Inspections waiting to be assigned to a clerk
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableInspections.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No available inspections</h3>
                  <p className="text-gray-600">
                    Check back later for new inspection assignments
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableInspections.map((inspection) => {
                    const property = state.properties.find(p => p.id === inspection.propertyId);
                    const agent = state.users.find(u => u.id === inspection.agentId);
                    const commission = inspection.price * 0.30;
                    
                    return (
                      <div key={inspection.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-500">Agent: {agent?.name}</p>
                          </div>
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-700">Scheduled</p>
                            <p className="text-gray-600">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Fee</p>
                            <p className="text-gray-600">£{inspection.price}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Your Commission</p>
                            <p className="text-gray-600">£{commission.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            onClick={() => handleAcceptInspection(inspection.id)}
                            className="flex-1 sm:flex-none bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Inspection
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleRejectInspection(inspection.id)}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <CardTitle>My Inspections</CardTitle>
              <CardDescription>
                Inspections assigned to you and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedInspections.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned inspections</h3>
                  <p className="text-gray-600">
                    Accept inspections from the available list to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedInspections.map((inspection) => {
                    const property = state.properties.find(p => p.id === inspection.propertyId);
                    const agent = state.users.find(u => u.id === inspection.agentId);
                    const commission = inspection.price * 0.30;
                    
                    return (
                      <div key={inspection.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-500">Agent: {agent?.name}</p>
                          </div>
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-700">Scheduled</p>
                            <p className="text-gray-600">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Fee</p>
                            <p className="text-gray-600">£{inspection.price}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Commission</p>
                            <p className="text-gray-600">£{commission.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Status</p>
                            <p className="text-gray-600">{inspection.status.replace('_', ' ')}</p>
                          </div>
                        </div>

                        {inspection.notes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600">{inspection.notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {inspection.status === 'assigned' && (
                            <Button 
                              onClick={() => handleStartInspection(inspection.id)}
                              size="sm"
                              className="bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              Start Inspection
                            </Button>
                          )}
                          {inspection.status === 'in_progress' && (
                            <Button 
                              onClick={() => handleCompleteInspection(inspection.id)}
                              size="sm"
                            >
                              Complete Inspection
                            </Button>
                          )}
                          {inspection.status === 'completed' && inspection.completedAt && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <p className="text-sm text-green-600">
                                Completed on {formatDate(inspection.completedAt)}
                              </p>
                              <Button 
                                onClick={() => handleViewReport(inspection.id)}
                                size="sm"
                                variant="outline"
                                className="bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Reports</CardTitle>
              <CardDescription>
                View and download completed inspection reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedReports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed reports</h3>
                  <p className="text-gray-600">
                    Complete inspections to view their reports here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedReports.map((inspection) => {
                    const property = state.properties.find(p => p.id === inspection.propertyId);
                    const agent = state.users.find(u => u.id === inspection.agentId);
                    const commission = inspection.price * 0.30;
                    
                    return (
                      <div key={inspection.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-500">Agent: {agent?.name}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-700">Scheduled</p>
                            <p className="text-gray-600">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Completed</p>
                            <p className="text-gray-600">{inspection.completedAt ? formatDate(inspection.completedAt) : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Fee</p>
                            <p className="text-gray-600">£{inspection.price}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Commission</p>
                            <p className="text-gray-600">£{commission.toFixed(2)}</p>
                          </div>
                        </div>

                        {inspection.notes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600">{inspection.notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            onClick={() => handleViewReport(inspection.id)}
                            size="sm"
                            className="bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}