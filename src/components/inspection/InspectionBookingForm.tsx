import React, { useState } from 'react';
import { useApp, useInspections, getCurrentPricing, DEFAULT_INSPECTION_PRICING } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, Calendar, PoundSterling, Clock } from 'lucide-react';
import { Property, InspectionType } from '../../types';

interface InspectionBookingFormProps {
  property: Property;
  onClose: () => void;
}

export function InspectionBookingForm({ property, onClose }: InspectionBookingFormProps) {
  const { state } = useApp();
  const { addInspection } = useInspections();
  const [formData, setFormData] = useState({
    inspectionType: '' as InspectionType | '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = state.currentUser!;

  // Define inspection types locally to avoid import issues
  const inspectionTypesData = [
    { value: 'routine' as InspectionType, label: 'Routine Inspection' },
    { value: 'fire_safety' as InspectionType, label: 'Fire & Safety Inspection' },
    { value: 'check_in' as InspectionType, label: 'Check-In Inspection' },
    { value: 'check_out' as InspectionType, label: 'Check-Out Inspection' },
  ];

  const calculatePrice = (inspectionType: InspectionType, bedrooms: number): number => {
    // Get pricing from admin settings, fallback to default pricing
    const pricing = getCurrentPricing(state, inspectionType);
    
    if (!pricing) return 0;
    return pricing[bedrooms] || pricing[5]; // Use 5+ bedroom pricing for anything above 5
  };

  const price = formData.inspectionType 
    ? calculatePrice(formData.inspectionType as InspectionType, property.bedrooms)
    : 0;

  const cashbackAmount = price * 0.15; // 15% cashback for agents

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.inspectionType || !formData.scheduledDate || !formData.scheduledTime) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate date is in the future
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      setError('Please select a future date and time');
      return;
    }

    setIsLoading(true);

    try {
      const inspectionData = {
        propertyId: property.id,
        inspectionType: formData.inspectionType as InspectionType,
        scheduledDate: scheduledDateTime.toISOString(),
        price,
        notes: formData.notes || undefined,
      };

      await addInspection(inspectionData);
      onClose();
    } catch (err: any) {
      console.error('Inspection booking error:', err);
      setError(err?.message || 'Failed to book inspection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeSlots.push({ value: timeString, label: displayTime });
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="mb-4 px-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Inspection</h1>
        <p className="text-gray-600 mt-1">Schedule an inspection for your property</p>
      </div>

      {/* Property Summary */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{property.address}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                </span>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Inspection Details</span>
          </CardTitle>
          <CardDescription>
            Select the type of inspection and preferred date/time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="inspectionType">Inspection Type *</Label>
              <Select 
                value={formData.inspectionType} 
                onValueChange={(value) => handleInputChange('inspectionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inspection type" />
                </SelectTrigger>
                <SelectContent>
                  {inspectionTypesData.map((type) => {
                    // Calculate price for this specific type and bedroom count using admin settings
                    const typePrice = calculatePrice(type.value, property.bedrooms);
                    
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{type.label}</span>
                          <span className="text-sm text-gray-500 ml-4">
                            £{typePrice}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date *</Label>
                <input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  min={minDate}
                  className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time *</Label>
                <Select 
                  value={formData.scheduledTime} 
                  onValueChange={(value) => handleInputChange('scheduledTime', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special instructions or requirements for the inspection..."
                rows={3}
              />
            </div>

            {/* Pricing Summary */}
            {price > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2 flex items-center">
                  <PoundSterling className="h-4 w-4 mr-1" />
                  Pricing Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800">Inspection Fee:</span>
                    <span className="font-medium text-green-900">£{price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800">Your Cashback (15%):</span>
                    <span className="font-medium text-green-900">£{cashbackAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-green-800">Net Cost:</span>
                      <span className="font-bold text-green-900">£{(price - cashbackAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !price}
              >
                {isLoading ? 'Booking Inspection...' : `Book Inspection - £${price.toFixed(2)}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}