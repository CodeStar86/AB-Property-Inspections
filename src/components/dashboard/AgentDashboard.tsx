import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  PoundSterling, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { PropertyRegistrationForm } from '../property/PropertyRegistrationForm';
import { PropertySelectionDialog } from '../property/PropertySelectionDialog';
import { InspectionBookingForm } from '../inspection/InspectionBookingForm';
import { Property, Inspection, INSPECTION_PRICING } from '../../types';
import { getCurrentBillingPeriod, formatBillingPeriod, getDaysRemainingInCurrentPeriod, isDateInBillingPeriod } from '../../utils/billingPeriods';
import { RealTimePeriodDisplay } from '../common/RealTimePeriodDisplay';
import { calculateCurrentPeriodUnprocessedCashback } from '../../utils/cashbackProcessing';

export function AgentDashboard() {
  const { state } = useApp();
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPropertySelection, setShowPropertySelection] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const currentUser = state.currentUser!;
  
  // Filter data for current agent
  const agentProperties = state.properties.filter(p => p.agentId === currentUser.id);
  const agentInspections = state.inspections.filter(i => i.agentId === currentUser.id);
  
  // Calculate statistics
  const totalInspections = agentInspections.length;
  const completedInspections = agentInspections.filter(i => i.status === 'completed').length;
  const upcomingInspections = agentInspections.filter(i => 
    i.status === 'scheduled' && new Date(i.scheduledDate) > new Date()
  ).length;
  
  // Get current billing period for cashback calculation
  const currentBillingPeriod = getCurrentBillingPeriod();
  const daysRemaining = getDaysRemainingInCurrentPeriod();
  
  // Calculate unprocessed cashback (15% of completed inspections in current billing period)
  const currentPeriodCashback = calculateCurrentPeriodUnprocessedCashback(
    agentInspections, // Only agent's inspections
    state.processedBillingPeriods
  );
  
  const currentPeriodInspections = agentInspections
    .filter(i => i.status === 'completed')
    .filter(i => isDateInBillingPeriod(new Date(i.completedDate || i.scheduledDate), currentBillingPeriod));
  
  const currentPeriodEarnings = currentPeriodInspections.reduce((sum, i) => sum + i.price, 0);
  const agentCashbackAmount = currentPeriodEarnings * 0.15; // Agent's share of unprocessed cashback
  const cashbackAmount = currentPeriodCashback.isProcessed ? 0 : agentCashbackAmount;

  const handleBookInspection = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingForm(true);
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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

  if (showPropertyForm) {
    return (
      <PropertyRegistrationForm onClose={() => setShowPropertyForm(false)} />
    );
  }

  if (showBookingForm && selectedProperty) {
    return (
      <InspectionBookingForm 
        property={selectedProperty}
        onClose={() => {
          setShowBookingForm(false);
          setSelectedProperty(null);
        }}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your properties and inspections</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-bold text-gray-900">{agentProperties.length}</p>
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingInspections}</p>
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
                <p className="text-sm font-medium text-gray-600">Cashback</p>
                <p className="text-2xl font-bold text-gray-900">£{cashbackAmount.toFixed(2)}</p>
                <div className="mt-1">
                  <RealTimePeriodDisplay compact={true} showIcon={false} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Button 
          onClick={() => setShowPropertyForm(true)}
          className="h-12 flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Register New Property</span>
        </Button>
        <Button 
          variant="outline"
          className="h-12 flex items-center justify-center space-x-2"
          disabled={agentProperties.length === 0}
          onClick={() => setShowPropertySelection(true)}
        >
          <Calendar className="h-5 w-5" />
          <span>Book Inspection</span>
        </Button>
      </div>

      {/* Cashback Tracking Section */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <PoundSterling className="h-5 w-5 text-purple-600" />
                  <span>Cashback Tracking</span>
                </CardTitle>
                <CardDescription>
                  Track your 15% cashback earnings from completed inspections
                </CardDescription>
              </div>
              <RealTimePeriodDisplay />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1 bg-green-100 rounded">
                    <PoundSterling className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Total Cashback</p>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  £{(agentInspections
                    .filter(i => i.status === 'completed')
                    .reduce((sum, i) => sum + i.price, 0) * 0.15).toFixed(2)}
                </p>
                <p className="text-xs text-green-700 mt-1">All time</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1 bg-blue-100 rounded">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Current Period</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">£{cashbackAmount.toFixed(2)}</p>
                <p className="text-xs text-blue-700 mt-1">Period #{currentBillingPeriod.periodNumber}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1 bg-purple-100 rounded">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Trend vs Last Period</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">0.0%</p>
                <p className="text-xs text-purple-700 mt-1">Increase</p>
              </div>
            </div>

            {/* Current Billing Period Details */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-medium text-indigo-900">Current Billing Period</h3>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Active</Badge>
                </div>
              </div>
              
              <p className="text-lg font-medium text-indigo-800 mb-4">
                {formatBillingPeriod(currentBillingPeriod)} • Period #{currentBillingPeriod.periodNumber}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-indigo-700 mb-1">Inspections</p>
                  <p className="text-3xl font-bold text-indigo-900">{currentPeriodInspections.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-indigo-700 mb-1">Revenue Generated</p>
                  <p className="text-3xl font-bold text-indigo-900">£{currentPeriodEarnings.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-indigo-700 mb-1">Cashback Earned</p>
                  <p className="text-3xl font-bold text-indigo-900">£{cashbackAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Recent Inspections Contributing to Cashback */}
              {currentPeriodInspections.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-indigo-900 mb-3">Recent Inspections Contributing to Cashback</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100">
                    {currentPeriodInspections.slice(0, 5).map((inspection) => {
                      const property = agentProperties.find(p => p.id === inspection.propertyId);
                      const cashbackEarned = inspection.price * 0.15;
                      
                      return (
                        <div key={inspection.id} className="flex justify-between items-center bg-white p-3 rounded border border-indigo-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{property?.address}</p>
                            <p className="text-sm text-gray-600">
                              {inspection.inspectionType} • {formatDate(inspection.completedDate || inspection.scheduledDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">£{inspection.price}</p>
                            <p className="text-sm font-medium text-green-600">+£{cashbackEarned.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cashback History */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Cashback History by Billing Period</h3>
              <p className="text-sm text-purple-600 mb-4">
                Detailed breakdown of cashback earnings over the last 12 billing periods
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Period #{currentBillingPeriod.periodNumber}</p>
                    <p className="text-sm text-gray-600">Current</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">£{cashbackAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">My Properties</TabsTrigger>
          <TabsTrigger value="inspections">My Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>
                Properties you have registered for inspections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentProperties.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                  <p className="text-gray-600 mb-4">
                    Register your first property to start booking inspections
                  </p>
                  <Button onClick={() => setShowPropertyForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Property
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {agentProperties.map((property) => (
                    <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{property.address}</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleBookInspection(property)}
                        >
                          Book Inspection
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Your Inspections</CardTitle>
              <CardDescription>
                Track the status of your inspection bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agentInspections.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections yet</h3>
                  <p className="text-gray-600 mb-4">
                    Book your first inspection to get started
                  </p>
                  <Button 
                    onClick={() => setShowBookingForm(true)}
                    disabled={agentProperties.length === 0}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Inspection
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {agentInspections.map((inspection) => {
                    const property = agentProperties.find(p => p.id === inspection.propertyId);
                    const clerk = state.users.find(u => u.id === inspection.clerkId);
                    const isInCurrentPeriod = inspection.status === 'completed' && 
                      isDateInBillingPeriod(new Date(inspection.completedDate || inspection.scheduledDate), currentBillingPeriod);
                    
                    return (
                      <div key={inspection.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{property?.address}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {inspection.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            {isInCurrentPeriod && (
                              <Badge variant="secondary" className="mt-1 text-xs bg-purple-100 text-purple-800">
                                Current Period
                              </Badge>
                            )}
                          </div>
                          <Badge className={getStatusColor(inspection.status)}>
                            {inspection.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Date</p>
                            <p className="text-gray-600">{formatDate(inspection.scheduledDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Price</p>
                            <p className="text-gray-600">£{inspection.price}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Clerk</p>
                            <p className="text-gray-600">{clerk?.name || 'Not assigned'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Cashback</p>
                            <p className="text-gray-600">£{(inspection.price * 0.15).toFixed(2)}</p>
                            {isInCurrentPeriod && (
                              <p className="text-xs text-purple-600">✓ Counted</p>
                            )}
                          </div>
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

      {/* Property Selection Dialog */}
      <PropertySelectionDialog
        isOpen={showPropertySelection}
        onClose={() => setShowPropertySelection(false)}
        properties={agentProperties}
        onSelectProperty={handlePropertySelect}
      />
    </div>
  );
}