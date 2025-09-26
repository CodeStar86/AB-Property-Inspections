import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  ArrowLeft,
  Download,
  FileText,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Camera,
  Printer
} from 'lucide-react';
import { Inspection, Property, User as UserType } from '../../types';
import { exportInspectionToHTML } from '../../utils/wordExport';

interface InspectionReportProps {
  inspection: Inspection;
  property: Property;
  agent: UserType;
  inspectionData: {
    sections: Array<{
      id: string;
      title: string;
      items: Array<{
        id: string;
        question: string;
        answer: 'yes' | 'no' | '';
        notes: string;
        photos: string[];
      }>;
    }>;
    formData: {
      overallNotes: string;
      recommendations: string;
      inspectorName: string;
    };
  };
  onBack: () => void;
}

export function InspectionReport({ 
  inspection, 
  property, 
  agent, 
  inspectionData, 
  onBack
}: InspectionReportProps) {
  const bedroomCount = property.bedrooms;
  const bathroomCount = bedroomCount === 0 ? 1 : Math.max(1, Math.floor(bedroomCount / 2) + 1);

  // Calculate summary statistics
  const totalQuestions = inspectionData.sections.reduce((sum, section) => sum + section.items.length, 0);
  const answeredQuestions = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.filter(item => item.answer !== '').length, 0
  );
  const yesAnswers = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.filter(item => item.answer === 'yes').length, 0
  );
  const noAnswers = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.filter(item => item.answer === 'no').length, 0
  );
  const totalPhotos = inspectionData.sections.reduce((sum, section) => 
    sum + section.items.reduce((itemSum, item) => itemSum + item.photos.length, 0), 0
  );

  const getInspectionTypeLabel = (type: string) => {
    switch (type) {
      case 'check_in': return 'Check-In Inspection';
      case 'check_out': return 'Check-Out Inspection';
      case 'routine': return 'Routine Inspection';
      case 'fire_safety': return 'Fire & Safety Inspection';
      default: return type;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col print:static print:inset-auto print:z-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4 flex-shrink-0 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="ghost" onClick={onBack} className="print:hidden p-2 sm:px-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                Inspection Report - {getInspectionTypeLabel(inspection.inspectionType)}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Completed on {new Date(inspection.completedAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button 
              onClick={handlePrint} 
              variant="outline"
              className="print:hidden text-xs sm:text-sm px-2 sm:px-4"
              size="sm"
            >
              <Printer className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Print Report</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button 
              onClick={() => exportInspectionToHTML(inspection, property, agent, inspectionData)} 
              variant="outline"
              className="print:hidden text-xs sm:text-sm px-2 sm:px-4"
              size="sm"
            >
              <Download className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export Report (HTML)</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 min-h-0 print:overflow-visible print:min-h-0 print:p-4">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 print:max-w-none print:space-y-4">
          {/* Report Header */}
          <Card data-print-section>
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mb-3 sm:mb-4">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
                  AB Property Inspection Services
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Property Inspection Report
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">
                  {getInspectionTypeLabel(inspection.inspectionType)}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {property.address}
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Property Information */}
          <Card data-print-section>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Property Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Address</div>
                <div className="text-gray-900">{property.address}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Property Type</div>
                <div className="text-gray-900 capitalize">{property.propertyType}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Bedrooms</div>
                <div className="text-gray-900">
                  {property.bedrooms === 0 ? 'Studio (0 bedrooms)' : `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Bathrooms (Estimated)</div>
                <div className="text-gray-900">{bathroomCount} bathroom{bathroomCount > 1 ? 's' : ''}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Inspecting Agent</div>
                <div className="text-gray-900">{agent.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Inspector</div>
                <div className="text-gray-900">{inspectionData.formData.inspectorName || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Inspection Date</div>
                <div className="text-gray-900">{new Date(inspection.scheduledDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Completion Date</div>
                <div className="text-gray-900">
                  {inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : 'Not completed'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card data-print-section>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Inspection Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{yesAnswers}</div>
                  <div className="text-sm text-gray-600">Satisfactory</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{noAnswers}</div>
                  <div className="text-sm text-gray-600">Issues Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalPhotos}</div>
                  <div className="text-sm text-gray-600">Photos Taken</div>
                </div>
              </div>
              {answeredQuestions < totalQuestions && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    Note: {totalQuestions - answeredQuestions} question{totalQuestions - answeredQuestions !== 1 ? 's' : ''} 
                    {totalQuestions - answeredQuestions !== 1 ? ' were' : ' was'} not answered.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Inspection Results */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Inspection Results</h2>
            
            {inspectionData.sections.map((section) => (
              <Card key={section.id} data-print-section>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.items.map((item) => (
                    <div key={item.id} className="border-l-2 border-gray-100 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-base font-medium text-gray-900 flex-1">
                          {item.question}
                        </h4>
                        <div className="ml-4 flex items-center space-x-2">
                          {item.answer === 'yes' && (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          )}
                          {item.answer === 'no' && (
                            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                              <XCircle className="h-3 w-3 mr-1" />
                              No
                            </Badge>
                          )}
                          {item.answer === '' && (
                            <Badge variant="outline" className="text-gray-500 border-gray-200">
                              Not Answered
                            </Badge>
                          )}
                          {item.photos.length > 0 && (
                            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                              <Camera className="h-3 w-3 mr-1" />
                              {item.photos.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-600 mb-1">Notes:</div>
                          <div className="text-sm text-gray-800 bg-gray-50 p-2 rounded border">
                            {item.notes}
                          </div>
                        </div>
                      )}
                      
                      {item.photos.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-2">
                            Photos ({item.photos.length}):
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {item.photos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="aspect-square">
                                <img
                                  src={photo}
                                  alt={`Photo ${photoIndex + 1} for ${item.question}`}
                                  className="w-full h-full object-cover rounded border"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overall Notes and Recommendations */}
          {(inspectionData.formData.overallNotes || inspectionData.formData.recommendations) && (
            <Card data-print-section>
              <CardHeader>
                <CardTitle>Inspector Notes & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionData.formData.overallNotes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Overall Notes</h4>
                    <div className="text-gray-800 bg-gray-50 p-3 rounded border">
                      {inspectionData.formData.overallNotes}
                    </div>
                  </div>
                )}
                {inspectionData.formData.recommendations && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                    <div className="text-gray-800 bg-blue-50 p-3 rounded border border-blue-200">
                      {inspectionData.formData.recommendations}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Report Footer */}
          <Card data-print-section>
            <CardContent className="pt-6">
              <Separator className="mb-4" />
              <div className="text-center text-sm text-gray-600">
                <p>This report was generated by AB Property Inspection Services</p>
                <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="mt-2">Inspector: {inspectionData.formData.inspectorName || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}