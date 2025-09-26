import React, { useState } from 'react';
import { useApp, useProperties } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, MapPin, Home } from 'lucide-react';
import { PropertyType, PROPERTY_TYPES, BEDROOM_OPTIONS } from '../../types';

interface PropertyRegistrationFormProps {
  onClose: () => void;
}

export function PropertyRegistrationForm({ onClose }: PropertyRegistrationFormProps) {
  const { state } = useApp();
  const { addProperty } = useProperties();
  const [formData, setFormData] = useState({
    address: '',
    propertyType: '' as PropertyType | '',
    bedrooms: '',
  });

  // Debug: Check if constants are loaded
  console.log('PROPERTY_TYPES:', PROPERTY_TYPES);
  console.log('BEDROOM_OPTIONS:', BEDROOM_OPTIONS);

  // Fallback data in case imports fail
  const fallbackPropertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'flat', label: 'Flat' },
    { value: 'maisonette', label: 'Maisonette' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'studio', label: 'Studio' },
    { value: 'bedsit', label: 'Bedsit' },
    { value: 'hmo', label: 'HMO (House in Multiple Occupation)' },
    { value: 'commercial', label: 'Commercial Property' },
  ];

  const fallbackBedroomOptions = [
    { value: 0, label: 'Studio (0 bedrooms)' },
    { value: 1, label: '1 bedroom' },
    { value: 2, label: '2 bedrooms' },
    { value: 3, label: '3 bedrooms' },
    { value: 4, label: '4 bedrooms' },
    { value: 5, label: '5+ bedrooms' },
  ];

  const propertyTypesData = PROPERTY_TYPES && PROPERTY_TYPES.length > 0 ? PROPERTY_TYPES : fallbackPropertyTypes;
  const bedroomOptionsData = BEDROOM_OPTIONS && BEDROOM_OPTIONS.length > 0 ? BEDROOM_OPTIONS : fallbackBedroomOptions;
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = state.currentUser!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.address || !formData.propertyType || formData.bedrooms === '') {
      setError('Please fill in all fields');
      return;
    }

    // Basic address validation for London
    if (!formData.address.toLowerCase().includes('london') && 
        !formData.address.match(/[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}/i)) {
      setError('Please enter a valid London address with postcode');
      return;
    }

    setIsLoading(true);

    try {
      const propertyData = {
        address: formData.address.trim(),
        propertyType: formData.propertyType as PropertyType,
        bedrooms: parseInt(formData.bedrooms),
      };

      await addProperty(propertyData);
      onClose();
    } catch (err: any) {
      console.error('Property registration error:', err);
      setError(err?.message || 'Failed to register property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Register New Property</h1>
        <p className="text-gray-600 mt-1">Add a property to your portfolio for inspections</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Property Details</span>
          </CardTitle>
          <CardDescription>
            Enter the property information for registration in our system
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
              <Label htmlFor="address">Property Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address including postcode (e.g., 123 Baker Street, London NW1 6XE)"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">
                Please include the full London address with postcode
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select 
                  value={formData.propertyType} 
                  onValueChange={(value) => handleInputChange('propertyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypesData.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Number of Bedrooms *</Label>
                <Select 
                  value={formData.bedrooms} 
                  onValueChange={(value) => handleInputChange('bedrooms', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {bedroomOptionsData.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing Preview */}
            {formData.bedrooms && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Estimated Inspection Pricing</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="font-medium text-blue-800">Routine</p>
                    <p className="text-blue-600">£{50 + parseInt(formData.bedrooms) * 25}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Fire & Safety</p>
                    <p className="text-blue-600">£{60 + parseInt(formData.bedrooms) * 25}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Check-In</p>
                    <p className="text-blue-600">£{80 + parseInt(formData.bedrooms) * 25}</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Check-Out</p>
                    <p className="text-blue-600">£{90 + parseInt(formData.bedrooms) * 25}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  You'll receive 15% cashback on completed inspections
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Registering Property...' : 'Register Property'}
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