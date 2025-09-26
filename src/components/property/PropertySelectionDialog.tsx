import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MapPin, Calendar } from 'lucide-react';
import { Property } from '../../types';

interface PropertySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export function PropertySelectionDialog({ 
  isOpen, 
  onClose, 
  properties, 
  onSelectProperty 
}: PropertySelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Select Property for Inspection</span>
          </DialogTitle>
          <DialogDescription>
            Choose which property you'd like to book an inspection for
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties available</h3>
              <p className="text-gray-600">
                You need to register a property first before booking inspections
              </p>
            </div>
          ) : (
            properties.map((property) => (
              <Card key={property.id} className="hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{property.address}</h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          Added {new Date(property.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        onSelectProperty(property);
                        onClose();
                      }}
                      className="sm:ml-4 w-full sm:w-auto"
                    >
                      Select Property
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}