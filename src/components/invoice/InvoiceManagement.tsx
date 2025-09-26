import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import {
  FileText,
  Calendar,
  PoundSterling,
  TrendingUp,
  Send,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  Clock,
  ChevronDown
} from 'lucide-react';
import { 
  generateInvoiceForPeriod, 
  generateAgentInvoiceForPeriod,
  generateAllAgentInvoicesForPeriod,
  generateInvoiceLineItems, 
  calculateInvoiceSummary,
  formatInvoiceNumber,
  getInvoiceStatusColor,
  updateInvoiceStatus
} from '../../utils/invoiceGeneration';
import { 
  getCurrentBillingPeriod, 
  getBillingPeriod, 
  formatBillingPeriod 
} from '../../utils/billingPeriods';
import { Invoice, InvoiceStatus } from '../../types';
import { InvoiceDetail } from './InvoiceDetail';

export function InvoiceManagement() {
  const { state, dispatch } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [generatingPeriod, setGeneratingPeriod] = useState<number | null>(null);
  const [selectedPeriodForGeneration, setSelectedPeriodForGeneration] = useState<number | null>(null);
  const [invoiceGenerationType, setInvoiceGenerationType] = useState<'combined' | 'agent-specific'>('agent-specific');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  // Get current billing period
  const currentPeriod = getCurrentBillingPeriod();
  
  // Generate available periods (current + last 12 periods)
  const getAvailablePeriods = () => {
    const periods = [];
    for (let i = 0; i <= 12; i++) {
      const periodNumber = currentPeriod.periodNumber - i;
      if (periodNumber > 0) {
        periods.push(getBillingPeriod(periodNumber));
      }
    }
    return periods;
  };
  
  const availablePeriods = getAvailablePeriods();
  
  // Get all agents for filtering
  const agents = state.users.filter(user => user.role === 'agent');
  
  // Filter invoices based on selected agent
  const filteredInvoices = selectedAgentFilter === 'all' 
    ? state.invoices
    : selectedAgentFilter === 'combined'
    ? state.invoices.filter(invoice => invoice.agentId === 'COMBINED')
    : state.invoices.filter(invoice => invoice.agentId === selectedAgentFilter);
  
  // Calculate invoice summary based on filtered invoices
  const invoiceSummary = calculateInvoiceSummary(filteredInvoices);

  // Generate invoice for current period
  const generateCurrentPeriodInvoice = () => {
    setGeneratingPeriod(currentPeriod.periodNumber);
    
    const invoice = generateInvoiceForPeriod(currentPeriod, {
      inspections: state.inspections,
      properties: state.properties,
      users: state.users,
      processedBillingPeriods: state.processedBillingPeriods
    });

    if (invoice) {
      dispatch({ type: 'ADD_INVOICE', payload: invoice });
    }
    
    setGeneratingPeriod(null);
  };

  // Generate invoice for a specific period
  const generateInvoiceForSelectedPeriod = (periodNumber: number) => {
    setGeneratingPeriod(periodNumber);
    
    const period = getBillingPeriod(periodNumber);
    
    if (invoiceGenerationType === 'combined') {
      // Generate single combined invoice
      const invoice = generateInvoiceForPeriod(period, {
        inspections: state.inspections,
        properties: state.properties,
        users: state.users,
        processedBillingPeriods: state.processedBillingPeriods
      });

      if (invoice) {
        dispatch({ type: 'ADD_INVOICE', payload: invoice });
        
        setTimeout(() => {
          toast.success('Combined Invoice Generated!', {
            description: `Invoice ${formatInvoiceNumber(invoice)} for £${invoice.totalAmount.toFixed(2)} has been created for period #${periodNumber}.`,
            duration: 5000,
          });
        }, 100);
      } else {
        setTimeout(() => {
          toast.info('No Invoiceable Inspections', {
            description: `No completed inspections found in billing period #${periodNumber}.`,
            duration: 4000,
          });
        }, 100);
      }
    } else {
      // Generate agent-specific invoices
      const agentInvoices = generateAllAgentInvoicesForPeriod(period, {
        inspections: state.inspections,
        properties: state.properties,
        users: state.users,
        processedBillingPeriods: state.processedBillingPeriods
      });

      if (agentInvoices.length > 0) {
        // Add all agent invoices
        agentInvoices.forEach(invoice => {
          dispatch({ type: 'ADD_INVOICE', payload: invoice });
        });
        
        const totalAmount = agentInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        setTimeout(() => {
          toast.success(`${agentInvoices.length} Agent Invoices Generated!`, {
            description: `Created individual invoices for ${agentInvoices.length} agents totaling £${totalAmount.toFixed(2)} for period #${periodNumber}.`,
            duration: 5000,
          });
        }, 100);
      } else {
        setTimeout(() => {
          toast.info('No Invoiceable Inspections', {
            description: `No completed inspections found for any agent in billing period #${periodNumber}.`,
            duration: 4000,
          });
        }, 100);
      }
    }
    
    setGeneratingPeriod(null);
    setSelectedPeriodForGeneration(null);
  };

  // Update invoice status
  const handleStatusUpdate = (invoice: Invoice, newStatus: InvoiceStatus) => {
    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      sentAt: newStatus === 'sent' ? new Date().toISOString() : invoice.sentAt,
      paidAt: newStatus === 'paid' ? new Date().toISOString() : invoice.paidAt
    };

    dispatch({ type: 'UPDATE_INVOICE', payload: updatedInvoice });
    
    // Show success notification
    setTimeout(() => {
      const statusMessages = {
        'generated': 'Invoice finalized successfully!',
        'sent': 'Invoice marked as sent!',
        'paid': 'Invoice marked as paid!',
        'overdue': 'Invoice marked as overdue!',
        'draft': 'Invoice status updated!'
      };
      
      toast.success(statusMessages[newStatus] || 'Invoice updated!', {
        description: `Invoice ${formatInvoiceNumber(updatedInvoice)} status changed to ${newStatus.replace('_', ' ').toUpperCase()}.`,
        duration: 3000,
      });
    }, 100);
  };

  // Check if current period invoice exists
  const currentPeriodInvoice = state.invoices.find(
    invoice => invoice.periodNumber === currentPeriod.periodNumber
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (showDetail && selectedInvoice) {
    return (
      <InvoiceDetail
        invoice={selectedInvoice}
        onBack={() => {
          setShowDetail(false);
          setSelectedInvoice(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Generate and manage 2-week billing period invoices
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceSummary.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PoundSterling className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">£{invoiceSummary.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">£{invoiceSummary.totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">£{invoiceSummary.totalOverdue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Period Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Billing Period</CardTitle>
          <CardDescription>
            {formatBillingPeriod(currentPeriod)} (Period #{currentPeriod.periodNumber})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPeriodInvoice ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge className={getInvoiceStatusColor(currentPeriodInvoice.status)}>
                  {currentPeriodInvoice.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  Invoice {formatInvoiceNumber(currentPeriodInvoice)} - £{currentPeriodInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedInvoice(currentPeriodInvoice);
                  setShowDetail(true);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  No invoice generated for current billing period yet.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => {
                  generateCurrentPeriodInvoice();
                  // Show success notification
                  setTimeout(() => {
                    const newInvoice = state.invoices.find(inv => inv.periodNumber === currentPeriod.periodNumber);
                    if (newInvoice) {
                      toast.success('Invoice Generated Successfully!', {
                        description: `Invoice ${formatInvoiceNumber(newInvoice)} for £${newInvoice.totalAmount.toFixed(2)} has been created for period #${currentPeriod.periodNumber}.`,
                        duration: 5000,
                      });
                    } else {
                      toast.info('No Invoiceable Inspections', {
                        description: 'No completed inspections found in the current billing period.',
                        duration: 4000,
                      });
                    }
                  }, 100);
                }}
                disabled={generatingPeriod === currentPeriod.periodNumber}
                className="min-w-[140px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                {generatingPeriod === currentPeriod.periodNumber ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Invoices</span>
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Agent
                </label>
                <Select
                  value={selectedAgentFilter}
                  onValueChange={setSelectedAgentFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex flex-col">
                        <span className="font-medium">All Agents</span>
                        <span className="text-xs text-gray-500">Show all invoices</span>
                      </div>
                    </SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-xs text-gray-500">{agent.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Manage and track all billing period invoices
            {selectedAgentFilter !== 'all' && (
              <span className="ml-2 text-blue-600">
                • Filtered by {
                  selectedAgentFilter === 'combined' 
                    ? 'Combined Invoices' 
                    : agents.find(a => a.id === selectedAgentFilter)?.name || 'Unknown Agent'
                }
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Agent-Specific Invoice Generation */}
          {selectedAgentFilter !== 'all' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">
                    Generate Invoice for {agents.find(a => a.id === selectedAgentFilter)?.name}
                  </h4>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Select Billing Period
                    </label>
                    <Select
                      value={selectedPeriodForGeneration?.toString() || ""}
                      onValueChange={(value) => setSelectedPeriodForGeneration(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a billing period..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map((period) => {
                          const existingAgentInvoices = state.invoices.filter(
                            inv => inv.periodNumber === period.periodNumber && inv.agentId === selectedAgentFilter
                          );
                          const isCurrent = period.periodNumber === currentPeriod.periodNumber;
                          
                          return (
                            <SelectItem 
                              key={period.periodNumber} 
                              value={period.periodNumber.toString()}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium">Period #{period.periodNumber}</span>
                                  {isCurrent && (
                                    <Badge variant="secondary" className="text-xs">Current</Badge>
                                  )}
                                  {existingAgentInvoices.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Has Invoice
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500 ml-4">
                                  {formatBillingPeriod(period)}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="sm:w-auto">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Action
                    </label>
                    <Button
                      onClick={() => {
                        if (selectedPeriodForGeneration && selectedAgentFilter !== 'all') {
                          setGeneratingPeriod(selectedPeriodForGeneration);
                          
                          const period = getBillingPeriod(selectedPeriodForGeneration);
                          const agentInvoice = generateAgentInvoiceForPeriod(period, selectedAgentFilter, {
                            inspections: state.inspections,
                            properties: state.properties,
                            users: state.users
                          });

                          if (agentInvoice) {
                            dispatch({ type: 'ADD_INVOICE', payload: agentInvoice });
                            
                            setTimeout(() => {
                              toast.success('Agent Invoice Generated!', {
                                description: `Invoice ${formatInvoiceNumber(agentInvoice)} for £${agentInvoice.totalAmount.toFixed(2)} has been created for ${agents.find(a => a.id === selectedAgentFilter)?.name} for period #${selectedPeriodForGeneration}.`,
                                duration: 5000,
                              });
                            }, 100);
                          } else {
                            setTimeout(() => {
                              toast.info('No Invoiceable Inspections', {
                                description: `No completed inspections found for ${agents.find(a => a.id === selectedAgentFilter)?.name} in billing period #${selectedPeriodForGeneration}.`,
                                duration: 4000,
                              });
                            }, 100);
                          }
                          
                          setGeneratingPeriod(null);
                          setSelectedPeriodForGeneration(null);
                        }
                      }}
                      disabled={!selectedPeriodForGeneration || generatingPeriod === selectedPeriodForGeneration}
                      className="min-w-[140px]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {generatingPeriod === selectedPeriodForGeneration ? 'Generating...' : 'Generate Invoice'}
                    </Button>
                  </div>
                </div>
                
                {selectedPeriodForGeneration && (
                  <div className="mt-2 p-3 bg-blue-100 rounded border border-blue-300">
                    <div className="flex items-start space-x-2">
                      <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Period #{selectedPeriodForGeneration}: {formatBillingPeriod(getBillingPeriod(selectedPeriodForGeneration))}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          This will create an invoice for {agents.find(a => a.id === selectedAgentFilter)?.name}'s completed inspections in this period.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {state.invoices.length === 0 
                    ? 'No invoices generated yet' 
                    : selectedAgentFilter === 'all' 
                      ? 'No invoices generated yet'
                      : `No invoices found for ${
                          selectedAgentFilter === 'combined' 
                            ? 'combined invoices' 
                            : agents.find(a => a.id === selectedAgentFilter)?.name || 'selected agent'
                        }`
                  }
                </p>
                <p className="text-sm">
                  {state.invoices.length === 0 
                    ? 'Generate your first invoice for the current billing period'
                    : selectedAgentFilter !== 'all' 
                      ? 'Try selecting a different agent or generate new invoices'
                      : 'Generate your first invoice for the current billing period'
                  }
                </p>
              </div>
            ) : (
              filteredInvoices
                .sort((a, b) => b.periodNumber - a.periodNumber)
                .map((invoice) => {
                  const updatedStatus = updateInvoiceStatus(invoice);
                  if (updatedStatus !== invoice.status) {
                    handleStatusUpdate(invoice, updatedStatus);
                  }

                  // Get agent information
                  const agent = invoice.agentId === 'COMBINED' 
                    ? null 
                    : state.users.find(u => u.id === invoice.agentId);

                  return (
                    <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              Invoice {formatInvoiceNumber(invoice)}
                            </h3>
                            <Badge className={getInvoiceStatusColor(updatedStatus)}>
                              {updatedStatus.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {agent && (
                              <Badge variant="outline" className="text-xs">
                                {agent.name}
                              </Badge>
                            )}
                            {invoice.agentId === 'COMBINED' && (
                              <Badge variant="secondary" className="text-xs">
                                Combined
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Period #{invoice.periodNumber}: {formatBillingPeriod({
                              start: new Date(invoice.billingPeriodStart),
                              end: new Date(invoice.billingPeriodEnd),
                              periodNumber: invoice.periodNumber
                            })}
                          </p>
                          {agent && (
                            <p className="text-xs text-gray-500 mt-1">
                              Agent: {agent.name} ({agent.email})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">£{invoice.totalAmount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            {invoice.inspectionIds.length} inspection{invoice.inspectionIds.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="font-medium text-gray-700">Generated</p>
                          <p className="text-gray-600">{formatDate(invoice.generatedAt)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Due Date</p>
                          <p className="text-gray-600">{formatDate(invoice.dueDate)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Agent Cashback</p>
                          <p className="text-gray-600">£{invoice.agentCashback.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Clerk Commission</p>
                          <p className="text-gray-600">£{invoice.clerkCommission.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {updatedStatus === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(invoice, 'generated')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalize
                            </Button>
                          )}
                          {updatedStatus === 'generated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(invoice, 'sent')}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Mark as Sent
                            </Button>
                          )}
                          {['sent', 'overdue'].includes(updatedStatus) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(invoice, 'paid')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}