import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
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
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import {
  PoundSterling,
  Users,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Eye,
  DollarSign,
  Banknote,
  Activity,
  Clock,
  FileText,
  Award,
  Download
} from 'lucide-react';
import {
  getAgentsWithUnprocessedCashback,
  createProcessedAgentCashback,
  validateAgentCashbackProcessing,
  AgentCashbackStatus,
  ProcessedAgentCashback
} from '../../utils/cashbackProcessing';
import { formatBillingPeriod } from '../../utils/billingPeriods';
import jsPDF from 'jspdf';

// Function to download agent-specific cashback breakdown as PDF
const downloadAgentCashbackBreakdown = (agentStatus: AgentCashbackStatus) => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = 30;

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize?: number) => {
      if (fontSize) doc.setFontSize(fontSize);
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * (fontSize || 12) * 0.35);
      } else {
        doc.text(text, x, y);
        return y + (fontSize || 12) * 0.35;
      }
    };

    // Header with gradient-like effect (simulate with purple)
    doc.setFillColor(139, 92, 246); // Purple color
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Company title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('AB Property Inspection Services', margin, 18);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Report title
    doc.setFontSize(16);
    yPosition = addText('Agent Cashback Processing Report', margin, yPosition, undefined, 16);
    yPosition += 10;

    // Agent information
    doc.setFontSize(12);
    yPosition = addText(`Agent: ${agentStatus.agentName}`, margin, yPosition, undefined, 12);
    yPosition = addText(`Processing Date: ${new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`, margin, yPosition, undefined, 12);
    yPosition += 10;

    // Summary section with background
    doc.setFillColor(243, 240, 255); // Light purple background
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * margin + 10, 40, 'F');
    
    doc.setFontSize(14);
    yPosition = addText('Summary', margin, yPosition, undefined, 14);
    yPosition += 5;
    
    doc.setFontSize(12);
    yPosition = addText(`Total Revenue: £${agentStatus.unprocessedRevenue.toFixed(2)}`, margin, yPosition, undefined, 12);
    yPosition = addText(`Total Cashback: £${agentStatus.unprocessedCashback.toFixed(2)}`, margin, yPosition, undefined, 12);
    yPosition = addText(`Number of Inspections: ${agentStatus.unprocessedInspections.length}`, margin, yPosition, undefined, 12);
    yPosition += 15;

    // Period Breakdown section
    doc.setFontSize(14);
    yPosition = addText('Period Breakdown', margin, yPosition, undefined, 14);
    yPosition += 5;

    if (agentStatus.periodsWithCashback && agentStatus.periodsWithCashback.length > 0) {
      // Table header
      doc.setFillColor(139, 92, 246);
      doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Period', margin + 2, yPosition + 4);
      doc.text('Date Range', margin + 30, yPosition + 4);
      doc.text('Inspections', margin + 90, yPosition + 4);
      doc.text('Revenue', margin + 125, yPosition + 4);
      doc.text('Cashback', margin + 155, yPosition + 4);
      yPosition += 12;
      
      doc.setTextColor(0, 0, 0);
      
      agentStatus.periodsWithCashback.forEach((period, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');
        }
        
        const periodRange = formatBillingPeriod(period.period);
        
        doc.text(`#${period.periodNumber}`, margin + 2, yPosition + 4);
        doc.text(periodRange.substring(0, 20), margin + 30, yPosition + 4);
        doc.text(period.inspections.length.toString(), margin + 90, yPosition + 4);
        doc.text(`£${period.revenue.toFixed(2)}`, margin + 125, yPosition + 4);
        doc.text(`£${period.cashback.toFixed(2)}`, margin + 155, yPosition + 4);
        yPosition += 8;
        
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
      });
    }

    yPosition += 15;

    // Detailed Inspection Breakdown section
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(14);
    yPosition = addText('Detailed Inspection Breakdown', margin, yPosition, undefined, 14);
    yPosition += 5;

    if (agentStatus.unprocessedInspections && agentStatus.unprocessedInspections.length > 0) {
      // Table header for detailed breakdown
      doc.setFillColor(139, 92, 246);
      doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Property Address', margin + 2, yPosition + 4);
      doc.text('Type', margin + 80, yPosition + 4);
      doc.text('Date', margin + 120, yPosition + 4);
      doc.text('Revenue', margin + 145, yPosition + 4);
      doc.text('Cashback', margin + 170, yPosition + 4);
      yPosition += 12;
      
      doc.setTextColor(0, 0, 0);
      
      agentStatus.unprocessedInspections.forEach((inspection, index) => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F');
        }
        
        const totalCost = inspection.totalCost || inspection.price || 0;
        const cashback = totalCost * 0.15;
        const inspectionDate = inspection.completedAt 
          ? new Date(inspection.completedAt).toLocaleDateString('en-GB')
          : 'Unknown';
        const propertyAddress = inspection.propertyAddress || 'Unknown Address';
        const inspectionType = inspection.inspectionType || 'Unknown';
        
        doc.text(propertyAddress.substring(0, 30), margin + 2, yPosition + 4);
        doc.text(inspectionType.substring(0, 15), margin + 80, yPosition + 4);
        doc.text(inspectionDate, margin + 120, yPosition + 4);
        doc.text(`£${totalCost.toFixed(2)}`, margin + 145, yPosition + 4);
        doc.text(`£${cashback.toFixed(2)}`, margin + 170, yPosition + 4);
        yPosition += 8;
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleString('en-GB')} | Page ${i} of ${totalPages}`, 
        margin, doc.internal.pageSize.height - 10);
      doc.text('AB Property Inspection Services - Confidential', 
        pageWidth - margin - 60, doc.internal.pageSize.height - 10);
    }

    // Save the PDF
    const filename = `agent-cashback-${agentStatus.agentName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF agent cashback breakdown:', error);
    // Don't throw the error, just log it and continue with processing
  }
};

export function CashbackManagement() {
  const { state, dispatch } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<AgentCashbackStatus | null>(null);
  const [showAgentDetail, setShowAgentDetail] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processNotes, setProcessNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get agents with unprocessed cashback
  const agentsWithCashback = getAgentsWithUnprocessedCashback(
    state.inspections,
    state.users,
    state.processedAgentCashbacks
  );

  // Calculate totals
  const totalUnprocessedCashback = agentsWithCashback.reduce((sum, agent) => sum + agent.unprocessedCashback, 0);
  const totalUnprocessedRevenue = agentsWithCashback.reduce((sum, agent) => sum + agent.unprocessedRevenue, 0);

  // Handle processing cashback for an agent
  const handleProcessAgentCashback = async (agentStatus: AgentCashbackStatus) => {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      toast.error('Unauthorized: Only admins can process cashback');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Validate processing
      const validation = validateAgentCashbackProcessing(
        agentStatus.agentId,
        state.processedAgentCashbacks
      );

      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      // Create processed agent cashback records (one per period)
      const processedCashbacks = createProcessedAgentCashback(
        agentStatus,
        state.currentUser.id,
        processNotes || `Cashback processed for ${agentStatus.agentName}`
      );

      // Add to state (in real app, this would go to backend)
      dispatch({ type: 'ADD_PROCESSED_AGENT_CASHBACKS', payload: processedCashbacks });

      // Generate and download agent-specific breakdown
      try {
        downloadAgentCashbackBreakdown(agentStatus);
        toast.success('Cashback Processed Successfully!', {
          description: `${agentStatus.agentName}: £${agentStatus.unprocessedCashback.toFixed(2)} cashback processed and reset. Breakdown downloaded.`,
          duration: 6000,
        });
      } catch (downloadError) {
        console.error('Download failed:', downloadError);
        toast.success('Cashback Processed Successfully!', {
          description: `${agentStatus.agentName}: £${agentStatus.unprocessedCashback.toFixed(2)} cashback processed and reset. (Download failed - check console)`,
          duration: 6000,
        });
      }

      // Reset form
      setShowProcessDialog(false);
      setProcessNotes('');
      setSelectedAgent(null);
      
    } catch (error) {
      console.error('Error processing agent cashback:', error);
      toast.error('Failed to process cashback. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openProcessDialog = (agentStatus: AgentCashbackStatus) => {
    setSelectedAgent(agentStatus);
    setShowProcessDialog(true);
  };

  const openAgentDetail = (agentStatus: AgentCashbackStatus) => {
    setSelectedAgent(agentStatus);
    setShowAgentDetail(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Agent Cashback Management</h2>
        <p className="text-gray-600 mt-1">
          Process cashback for individual agents. Each agent's cashback is processed separately and resets after processing.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Agents Pending</p>
                <p className="text-xl font-bold">{agentsWithCashback.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PoundSterling className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Unprocessed Cashback</p>
                <p className="text-xl font-bold">£{totalUnprocessedCashback.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold">£{totalUnprocessedRevenue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents with Unprocessed Cashback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Agents with Unprocessed Cashback</span>
          </CardTitle>
          <CardDescription>
            Individual agents with cashback ready for processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentsWithCashback.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">
                All agents' cashback has been processed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentsWithCashback.map((agentStatus) => (
                <div
                  key={agentStatus.agentId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{agentStatus.agentName}</h4>
                      <Badge variant="secondary">
                        {agentStatus.unprocessedInspections.length} inspections
                      </Badge>
                      <Badge variant="outline">
                        {agentStatus.periodsWithCashback.length} periods
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="text-gray-700">
                        <strong>Revenue:</strong> £{agentStatus.unprocessedRevenue.toFixed(2)}
                      </span>
                      <span className="text-green-700">
                        <strong>Cashback:</strong> £{agentStatus.unprocessedCashback.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAgentDetail(agentStatus)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Process Cashback for {agentStatus.agentName}</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will process and reset cashback for this agent:
                            <br />
                            • Agent Cashback to Process: £{agentStatus.unprocessedCashback.toFixed(2)}
                            <br />
                            • Total Revenue: £{agentStatus.unprocessedRevenue.toFixed(2)}
                            <br />
                            • Periods: {agentStatus.periodsWithCashback.length}
                            <br />
                            <br />
                            <strong>This action cannot be undone.</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => openProcessDialog(agentStatus)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Confirm Process
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing History */}
      {state.processedAgentCashbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Processing History</span>
            </CardTitle>
            <CardDescription>
              Recently processed agent cashbacks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {state.processedAgentCashbacks
                .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
                .slice(0, 10) // Show last 10 processed records
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                  >
                    <div>
                      <p className="font-medium">{record.agentName}</p>
                      <p className="text-sm text-gray-600">
                        Period #{record.periodNumber} - Processed on {formatDate(record.processedAt)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p><strong>Cashback:</strong> £{record.cashbackAmount.toFixed(2)}</p>
                      <p><strong>Revenue:</strong> £{record.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Process Cashback - {selectedAgent?.agentName}
            </DialogTitle>
            <DialogDescription>
              Add optional notes for this cashback processing transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="process-notes">Processing Notes (Optional)</Label>
              <Textarea
                id="process-notes"
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                placeholder="Enter any notes about this cashback processing..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowProcessDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedAgent && handleProcessAgentCashback(selectedAgent)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Process Cashback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Detail Dialog */}
      {selectedAgent && (
        <AgentDetailDialog
          agentStatus={selectedAgent}
          isOpen={showAgentDetail}
          onClose={() => {
            setShowAgentDetail(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
}

// Separate component for agent details
function AgentDetailDialog({
  agentStatus,
  isOpen,
  onClose
}: {
  agentStatus: AgentCashbackStatus;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {agentStatus.agentName} - Cashback Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of unprocessed cashback across billing periods
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Agent Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{agentStatus.unprocessedInspections.length}</p>
                    <p className="text-sm text-blue-800">Total Inspections</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">£{agentStatus.unprocessedRevenue.toFixed(0)}</p>
                    <p className="text-sm text-green-800">Total Revenue</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">£{agentStatus.unprocessedCashback.toFixed(0)}</p>
                    <p className="text-sm text-purple-800">Total Cashback (15%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Period Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Period Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentStatus.periodsWithCashback.map((period) => (
                    <div key={period.periodNumber} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Period #{period.periodNumber}</p>
                        <p className="text-sm text-gray-600">{formatBillingPeriod(period.period)}</p>
                        <p className="text-sm text-gray-600">{period.inspections.length} inspections</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{period.cashback.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Revenue: £{period.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Inspections */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agentStatus.unprocessedInspections.map((inspection, index) => (
                    <div key={inspection.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{inspection.propertyAddress}</p>
                        <p className="text-gray-600">{inspection.inspectionType} - {inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString('en-GB') : 'Unknown date'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{((inspection.totalCost || inspection.price || 0) * 0.15).toFixed(2)}</p>
                        <p className="text-gray-600">Revenue: £{(inspection.totalCost || inspection.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}