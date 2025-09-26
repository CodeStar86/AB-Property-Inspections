import React, { useState } from 'react';
import { useApp, DEFAULT_INSPECTION_PRICING } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  PoundSterling, 
  Save, 
  RotateCcw, 
  TrendingUp,
  Home,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { InspectionType } from '../../types';
import { toast } from 'sonner';

// Define arrays locally to avoid import issues
const INSPECTION_TYPES: Array<{ value: InspectionType; label: string }> = [
  { value: 'routine', label: 'Routine Inspection' },
  { value: 'fire_safety', label: 'Fire & Safety Inspection' },
  { value: 'check_in', label: 'Check-In Inspection' },
  { value: 'check_out', label: 'Check-Out Inspection' },
];

const BEDROOM_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Studio (0 bedrooms)' },
  { value: 1, label: '1 bedroom' },
  { value: 2, label: '2 bedrooms' },
  { value: 3, label: '3 bedrooms' },
  { value: 4, label: '4 bedrooms' },
  { value: 5, label: '5+ bedrooms' },
];

export function PricingManagement() {
  const { state, dispatch } = useApp();
  const [editingType, setEditingType] = useState<InspectionType | null>(null);
  const [tempPricing, setTempPricing] = useState<Record<number, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const currentUser = state.currentUser!;

  const getPricingForType = (inspectionType: InspectionType) => {
    const pricing = state.pricingSettings.find(p => p.inspectionType === inspectionType);
    return pricing?.bedroomPricing || DEFAULT_INSPECTION_PRICING[inspectionType];
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

  const startEditing = (inspectionType: InspectionType) => {
    const currentPricing = getPricingForType(inspectionType);
    setEditingType(inspectionType);
    setTempPricing({ ...currentPricing });
    setHasChanges(false);
  };

  const cancelEditing = () => {
    setEditingType(null);
    setTempPricing({});
    setHasChanges(false);
  };

  const handlePriceChange = (bedrooms: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTempPricing(prev => ({
      ...prev,
      [bedrooms]: numValue
    }));
    setHasChanges(true);
  };

  const savePricing = () => {
    if (!editingType) return;

    const updatedPricing = {
      id: `${editingType}-pricing`,
      inspectionType: editingType,
      bedroomPricing: { ...tempPricing },
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.id
    };

    dispatch({ type: 'UPDATE_PRICING', payload: updatedPricing });
    toast.success(`Pricing updated for ${editingType.replace('_', ' ')} inspections`);
    setEditingType(null);
    setHasChanges(false);
  };

  const resetToDefaults = (inspectionType: InspectionType) => {
    const defaultPricing = {
      id: `${inspectionType}-pricing`,
      inspectionType: inspectionType,
      bedroomPricing: { ...DEFAULT_INSPECTION_PRICING[inspectionType] },
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.id
    };

    dispatch({ type: 'UPDATE_PRICING', payload: defaultPricing });
    toast.success(`Pricing reset to defaults for ${inspectionType.replace('_', ' ')} inspections`);
  };

  const calculateRevenueImpact = () => {
    const inspections = state.inspections.filter(i => i.status === 'completed');
    let currentTotal = 0;
    let projectedTotal = 0;

    inspections.forEach(inspection => {
      const property = state.properties.find(p => p.id === inspection.propertyId);
      if (property) {
        currentTotal += inspection.price;

        // Calculate what it would cost with current pricing
        const currentPricing = getPricingForType(inspection.inspectionType);
        const newPrice = currentPricing[property.bedrooms] || currentPricing[5];
        projectedTotal += newPrice;
      }
    });

    return {
      current: currentTotal,
      projected: projectedTotal,
      difference: projectedTotal - currentTotal,
      percentChange: currentTotal > 0 ? ((projectedTotal - currentTotal) / currentTotal) * 100 : 0
    };
  };

  const revenueImpact = calculateRevenueImpact();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Pricing Management</h2>
          <p className="text-gray-600 mt-1">Configure inspection prices based on property bedroom count</p>
        </div>
      </div>

      {/* Revenue Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Revenue Impact Analysis</span>
          </CardTitle>
          <CardDescription>How current pricing changes would affect completed inspections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Historical Revenue</p>
              <p className="text-2xl font-bold text-blue-900">£{revenueImpact.current.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">Current Pricing Revenue</p>
              <p className="text-2xl font-bold text-green-900">£{revenueImpact.projected.toFixed(2)}</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${revenueImpact.difference >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${revenueImpact.difference >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                Difference
              </p>
              <p className={`text-2xl font-bold ${revenueImpact.difference >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {revenueImpact.difference >= 0 ? '+' : ''}£{revenueImpact.difference.toFixed(2)}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${revenueImpact.percentChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${revenueImpact.percentChange >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                Percent Change
              </p>
              <p className={`text-2xl font-bold ${revenueImpact.percentChange >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                {revenueImpact.percentChange >= 0 ? '+' : ''}{revenueImpact.percentChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Tabs defaultValue={INSPECTION_TYPES[0]?.value || 'routine'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
          {INSPECTION_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value} className="text-xs sm:text-sm px-1 sm:px-3 py-2 h-auto">
              <span className="sm:hidden">
                {type.value === 'fire_safety' ? 'Fire' : 
                 type.value === 'check_in' ? 'In' :
                 type.value === 'check_out' ? 'Out' :
                 type.label.split(' ')[0]}
              </span>
              <span className="hidden sm:inline">
                {type.label.split(' ')[0]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {INSPECTION_TYPES.map((type) => {
          const currentPricing = getPricingForType(type.value);
          const pricingSetting = state.pricingSettings.find(p => p.inspectionType === type.value);
          const isEditing = editingType === type.value;
          
          return (
            <TabsContent key={type.value} value={type.value}>
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <PoundSterling className="h-5 w-5" />
                        <span>{type.label} Pricing</span>
                      </CardTitle>
                      <CardDescription>
                        Set prices for {type.label.toLowerCase()} based on property bedroom count
                      </CardDescription>
                      {pricingSetting && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0 mt-2">
                          <Badge variant="outline" className="text-xs w-fit">
                            Last updated: {formatDate(pricingSetting.lastUpdated)}
                          </Badge>
                          <Badge variant="outline" className="text-xs w-fit">
                            By: {state.users.find(u => u.id === pricingSetting.updatedBy)?.name || 'Unknown'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {isEditing ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={cancelEditing}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={savePricing}
                            disabled={!hasChanges}
                            className="flex items-center space-x-1 w-full sm:w-auto"
                          >
                            <Save className="h-4 w-4" />
                            <span>Save Changes</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => resetToDefaults(type.value)}
                            className="w-full sm:w-auto"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Reset to Defaults</span>
                            <span className="sm:hidden">Reset</span>
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => startEditing(type.value)}
                            className="w-full sm:w-auto"
                          >
                            Edit Prices
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hasChanges && isEditing && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You have unsaved changes. Don't forget to save your pricing updates.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {BEDROOM_OPTIONS.map((bedroom) => {
                        const currentPrice = isEditing ? tempPricing[bedroom.value] : currentPricing[bedroom.value];
                        const isDefaultPrice = currentPrice === DEFAULT_INSPECTION_PRICING[type.value][bedroom.value];
                        
                        return (
                          <div key={bedroom.value} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Home className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-sm">{bedroom.label}</span>
                              </div>
                              {!isDefaultPrice && !isEditing && (
                                <Badge variant="secondary" className="text-xs">
                                  Modified
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`price-${type.value}-${bedroom.value}`}>
                                Price (£)
                              </Label>
                              {isEditing ? (
                                <Input
                                  id={`price-${type.value}-${bedroom.value}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={tempPricing[bedroom.value] || 0}
                                  onChange={(e) => handlePriceChange(bedroom.value, e.target.value)}
                                  className="text-lg font-medium"
                                />
                              ) : (
                                <div className="text-2xl font-bold text-green-600">
                                  £{currentPrice?.toFixed(2) || '0.00'}
                                </div>
                              )}
                              
                              {!isDefaultPrice && (
                                <div className="text-xs text-gray-500">
                                  Default: £{DEFAULT_INSPECTION_PRICING[type.value][bedroom.value].toFixed(2)}
                                </div>
                              )}
                            </div>

                            {isEditing && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="text-xs text-gray-500">
                                  Agent cashback: £{((tempPricing[bedroom.value] || 0) * 0.15).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Clerk commission: £{((tempPricing[bedroom.value] || 0) * 0.30).toFixed(2)}
                                </div>
                                <div className="text-xs font-medium text-gray-700">
                                  Net revenue: £{((tempPricing[bedroom.value] || 0) * 0.55).toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!isEditing && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Price Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                          {BEDROOM_OPTIONS.map((bedroom) => (
                            <div key={bedroom.value} className="text-center">
                              <div className="text-gray-600">{bedroom.value === 0 ? 'Studio' : `${bedroom.value}BR`}</div>
                              <div className="font-bold">£{currentPricing[bedroom.value]?.toFixed(0) || '0'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}