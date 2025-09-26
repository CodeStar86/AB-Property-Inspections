import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  ArrowLeft,
  FileText,
  Calendar,
  PoundSterling,
  MapPin,
  User,
  Clock,
  Download,
  Send,
  CheckCircle
} from 'lucide-react';
import { 
  generateInvoiceLineItems, 
  formatInvoiceNumber,
  getInvoiceStatusColor
} from '../../utils/invoiceGeneration';
import { formatBillingPeriod } from '../../utils/billingPeriods';
import { Invoice, InvoiceStatus } from '../../types';
import { toast } from 'sonner';

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
  onStatusUpdate: (invoice: Invoice, newStatus: InvoiceStatus) => void;
}

export function InvoiceDetail({ invoice, onBack, onStatusUpdate }: InvoiceDetailProps) {
  const { state } = useApp();

  // Generate line items for this invoice
  const lineItems = generateInvoiceLineItems(invoice, {
    inspections: state.inspections,
    properties: state.properties,
    users: state.users
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const billingPeriod = {
    start: new Date(invoice.billingPeriodStart),
    end: new Date(invoice.billingPeriodEnd),
    periodNumber: invoice.periodNumber
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <Button variant="ghost" onClick={onBack} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              Invoice {formatInvoiceNumber(invoice)}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Period #{invoice.periodNumber}: {formatBillingPeriod(billingPeriod)}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Badge className={getInvoiceStatusColor(invoice.status)}>
            {invoice.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Invoice Summary */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Billing Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-medium">{formatInvoiceNumber(invoice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Period:</span>
                      <span className="font-medium">Period #{invoice.periodNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period Dates:</span>
                      <span className="font-medium">{formatBillingPeriod(billingPeriod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-medium">{formatDate(invoice.generatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Bill To
                  </h3>
                  <div className="text-sm">
                    {invoice.agentId === 'COMBINED' ? (
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">Combined Invoice</p>
                        <p className="text-gray-600">Multiple Agents</p>
                        <p className="text-gray-500 text-xs">This invoice covers multiple agents</p>
                      </div>
                    ) : (
                      (() => {
                        const agent = state.users.find(u => u.id === invoice.agentId);
                        return agent ? (
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{agent.name}</p>
                            <p className="text-gray-600">{agent.email}</p>
                            {agent.address && (
                              <div className="text-gray-600 mt-2">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-3 w-3 mt-1 text-gray-400" />
                                  <p className="text-xs leading-relaxed">{agent.address}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">Unknown Agent</p>
                            <p className="text-gray-500 text-xs">Agent information not found</p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Invoice Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Inspections:</span>
                      <span className="font-medium">{invoice.inspectionIds.length}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total Amount:</span>
                      <span className="text-gradient-purple">£{invoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
              <CardDescription>
                Completed inspections included in this billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.inspectionId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.propertyAddress}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900">£{item.amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(item.completedDate)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {item.agentName}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {item.clerkName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.status === 'draft' && (
                <>
                  <Button 
                    className="w-full"
                    onClick={() => onStatusUpdate(invoice, 'generated')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalize Invoice
                  </Button>
                  <p className="text-xs text-gray-500">
                    Finalize the invoice to make it ready for sending
                  </p>
                </>
              )}
              
              {invoice.status === 'generated' && (
                <>
                  <Button 
                    className="w-full"
                    onClick={() => onStatusUpdate(invoice, 'sent')}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Mark as Sent
                  </Button>
                  <p className="text-xs text-gray-500">
                    Mark the invoice as sent to the client
                  </p>
                </>
              )}
              
              {['sent', 'overdue'].includes(invoice.status) && (
                <>
                  <Button 
                    className="w-full"
                    onClick={() => onStatusUpdate(invoice, 'paid')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                  <p className="text-xs text-gray-500">
                    Record payment receipt for this invoice
                  </p>
                </>
              )}
              
              {invoice.status === 'paid' && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Invoice Paid</p>
                  {invoice.paidAt && (
                    <p className="text-xs text-gray-500">
                      Paid on {formatDate(invoice.paidAt)}
                    </p>
                  )}
                </div>
              )}

              <Separator />
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={async () => {
                  try {
                    // Get the current invoice from state to ensure we have the latest status
                    const currentInvoice = state.invoices.find(inv => inv.id === invoice.id) || invoice;
                    
                    // Dynamic import of jsPDF
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();
                    
                    // Header
                    doc.setFontSize(20);
                    doc.text('AB Property Inspection Services', 20, 25);
                    doc.setFontSize(12);
                    doc.text('Invoice', 20, 35);
                    
                    // Invoice details
                    const startY = 50;
                    doc.setFontSize(10);
                    doc.text(`Invoice Number: ${formatInvoiceNumber(currentInvoice)}`, 20, startY);
                    doc.text(`Generated: ${new Date(currentInvoice.generatedAt).toLocaleDateString()}`, 20, startY + 10);
                    doc.text(`Due Date: ${new Date(currentInvoice.dueDate).toLocaleDateString()}`, 20, startY + 20);
                    doc.text(`Status: ${currentInvoice.status.replace('_', ' ').toUpperCase()}`, 20, startY + 30);
                    
                    // Billing period
                    doc.text(`Billing Period: ${new Date(currentInvoice.billingPeriodStart).toLocaleDateString()} - ${new Date(currentInvoice.billingPeriodEnd).toLocaleDateString()}`, 20, startY + 50);
                    
                    // Agent info (if not combined invoice)
                    if (currentInvoice.agentId !== 'COMBINED') {
                      const agent = state.users.find(u => u.id === currentInvoice.agentId);
                      doc.text(`Bill To: ${agent?.name || 'Unknown'}`, 20, startY + 70);
                      doc.text(`Email: ${agent?.email || 'Unknown'}`, 20, startY + 80);
                      if (agent?.address) {
                        // Split address into multiple lines if too long
                        const addressLines = agent.address.match(/.{1,60}(\s|$)/g) || [agent.address];
                        addressLines.forEach((line, index) => {
                          doc.text(`${index === 0 ? 'Address: ' : '         '}${line.trim()}`, 20, startY + 90 + (index * 10));
                        });
                      }
                    }
                    
                    // Invoice total
                    const agent = state.users.find(u => u.id === currentInvoice.agentId);
                    const totalY = startY + (agent?.address ? 120 : 100);
                    doc.setFontSize(14);
                    doc.text('Invoice Total', 20, totalY);
                    doc.setFontSize(12);
                    doc.text(`Total Amount Due: £${currentInvoice.totalAmount.toFixed(2)}`, 20, totalY + 20);
                    
                    // Line items
                    const lineItems = generateInvoiceLineItems(currentInvoice, {
                      inspections: state.inspections,
                      properties: state.properties,
                      users: state.users
                    });
                    
                    if (lineItems.length > 0) {
                      const itemsY = totalY + 40;
                      doc.setFontSize(12);
                      doc.text('Inspection Details', 20, itemsY);
                      doc.setFontSize(8);
                      
                      lineItems.forEach((item, index) => {
                        const y = itemsY + 15 + (index * 15);
                        // Create proper description from line item data
                        const description = `${item.propertyAddress} - ${item.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${new Date(item.completedDate).toLocaleDateString()})`;
                        doc.text(description, 20, y);
                        doc.text(`£${item.amount.toFixed(2)}`, 150, y);
                      });
                    }
                    
                    // Footer
                    doc.setFontSize(8);
                    doc.text('AB Property Inspection Services - Professional Property Inspections', 20, 280);
                    doc.text('Generated on: ' + new Date().toLocaleString(), 20, 290);
                    
                    // Download
                    doc.save(`Invoice-${formatInvoiceNumber(currentInvoice)}.pdf`);
                  } catch (error) {
                    console.error('Error generating PDF:', error);
                    // Get the current invoice for fallback too
                    const currentInvoice = state.invoices.find(inv => inv.id === invoice.id) || invoice;
                    
                    // Generate line items for text fallback
                    const lineItems = generateInvoiceLineItems(currentInvoice, {
                      inspections: state.inspections,
                      properties: state.properties,
                      users: state.users
                    });
                    
                    const inspectionDetails = lineItems.map(item => 
                      `- ${item.propertyAddress} - ${item.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${new Date(item.completedDate).toLocaleDateString()}) - £${item.amount.toFixed(2)}`
                    ).join('\n');
                    
                    // Fallback: generate a simple text file
                    const invoiceText = `
AB Property Inspection Services
Invoice ${formatInvoiceNumber(currentInvoice)}

Generated: ${new Date(currentInvoice.generatedAt).toLocaleDateString()}
Due Date: ${new Date(currentInvoice.dueDate).toLocaleDateString()}
Status: ${currentInvoice.status.replace('_', ' ').toUpperCase()}

Billing Period: ${new Date(currentInvoice.billingPeriodStart).toLocaleDateString()} - ${new Date(currentInvoice.billingPeriodEnd).toLocaleDateString()}

${currentInvoice.agentId !== 'COMBINED' ? (() => {
  const agent = state.users.find(u => u.id === currentInvoice.agentId);
  return `Bill To: ${agent?.name || 'Unknown'}
Email: ${agent?.email || 'Unknown'}
${agent?.address ? `Address: ${agent.address}` : ''}`;
})() : 'Combined Invoice for Multiple Agents'}

Invoice Total:
Total Amount Due: £${currentInvoice.totalAmount.toFixed(2)}

Inspection Details:
${inspectionDetails}

Generated on: ${new Date().toLocaleString()}
                    `;
                    
                    const blob = new Blob([invoiceText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Invoice-${formatInvoiceNumber(currentInvoice)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={async () => {
                  try {
                    // Get the current invoice and agent details
                    const currentInvoice = state.invoices.find(inv => inv.id === invoice.id) || invoice;
                    const agent = state.users.find(u => u.id === currentInvoice.agentId);
                    
                    if (!agent?.email) {
                      toast.error('Agent email not found');
                      return;
                    }

                    // First, generate and download the PDF
                    const { jsPDF } = await import('jspdf');
                    const doc = new jsPDF();
                    
                    // Header
                    doc.setFontSize(20);
                    doc.text('AB Property Inspection Services', 20, 25);
                    doc.setFontSize(12);
                    doc.text('Invoice', 20, 35);
                    
                    // Invoice details
                    const startY = 50;
                    doc.setFontSize(10);
                    doc.text(`Invoice Number: ${formatInvoiceNumber(currentInvoice)}`, 20, startY);
                    doc.text(`Generated: ${new Date(currentInvoice.generatedAt).toLocaleDateString()}`, 20, startY + 10);
                    doc.text(`Due Date: ${new Date(currentInvoice.dueDate).toLocaleDateString()}`, 20, startY + 20);
                    doc.text(`Status: ${currentInvoice.status.replace('_', ' ').toUpperCase()}`, 20, startY + 30);
                    
                    // Billing period
                    doc.text(`Billing Period: ${new Date(currentInvoice.billingPeriodStart).toLocaleDateString()} - ${new Date(currentInvoice.billingPeriodEnd).toLocaleDateString()}`, 20, startY + 50);
                    
                    // Agent info
                    doc.text(`Bill To: ${agent.name}`, 20, startY + 70);
                    doc.text(`Email: ${agent.email}`, 20, startY + 80);
                    if (agent.address) {
                      const addressLines = agent.address.match(/.{1,60}(\s|$)/g) || [agent.address];
                      addressLines.forEach((line, index) => {
                        doc.text(`${index === 0 ? 'Address: ' : '         '}${line.trim()}`, 20, startY + 90 + (index * 10));
                      });
                    }
                    
                    // Invoice total
                    const totalY = startY + (agent.address ? 120 : 100);
                    doc.setFontSize(14);
                    doc.text('Invoice Total', 20, totalY);
                    doc.setFontSize(12);
                    doc.text(`Total Amount Due: £${currentInvoice.totalAmount.toFixed(2)}`, 20, totalY + 20);
                    
                    // Line items
                    const lineItems = generateInvoiceLineItems(currentInvoice, {
                      inspections: state.inspections,
                      properties: state.properties,
                      users: state.users
                    });
                    
                    if (lineItems.length > 0) {
                      const itemsY = totalY + 40;
                      doc.setFontSize(12);
                      doc.text('Inspection Details', 20, itemsY);
                      doc.setFontSize(8);
                      
                      lineItems.forEach((item, index) => {
                        const y = itemsY + 15 + (index * 15);
                        const description = `${item.propertyAddress} - ${item.inspectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${new Date(item.completedDate).toLocaleDateString()})`;
                        doc.text(description, 20, y);
                        doc.text(`£${item.amount.toFixed(2)}`, 150, y);
                      });
                    }
                    
                    // Footer
                    doc.setFontSize(8);
                    doc.text('AB Property Inspection Services - Professional Property Inspections', 20, 280);
                    doc.text('Generated on: ' + new Date().toLocaleString(), 20, 290);
                    
                    // Download the PDF
                    const fileName = `Invoice-${formatInvoiceNumber(currentInvoice)}.pdf`;
                    doc.save(fileName);
                    
                    // Create email template
                    const subject = encodeURIComponent(`Invoice ${formatInvoiceNumber(currentInvoice)} - AB Property Inspection Services`);
                    const body = encodeURIComponent(`Dear ${agent.name},

Please find attached your invoice for the billing period ${new Date(currentInvoice.billingPeriodStart).toLocaleDateString()} - ${new Date(currentInvoice.billingPeriodEnd).toLocaleDateString()}.

Invoice Details:
- Invoice Number: ${formatInvoiceNumber(currentInvoice)}
- Total Amount: £${currentInvoice.totalAmount.toFixed(2)}
- Due Date: ${new Date(currentInvoice.dueDate).toLocaleDateString()}

Payment terms: Net 30 days from invoice date.

Please note: The invoice PDF has been downloaded to your device. You will need to manually attach it to this email before sending.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business.

Best regards,
AB Property Inspection Services
Professional Property Inspections`);
                    
                    // Open email client with pre-filled content
                    const mailtoLink = `mailto:${agent.email}?subject=${subject}&body=${body}`;
                    window.open(mailtoLink, '_blank');
                    
                    toast.success(`Invoice PDF downloaded and email opened for ${agent.name}. Please attach the PDF file manually.`);
                    
                  } catch (error) {
                    console.error('Error preparing email:', error);
                    toast.error('Failed to prepare email. Please try again.');
                  }
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Email Invoice
              </Button>
            </CardContent>
          </Card>

          {/* Invoice Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Generated</p>
                    <p className="text-xs text-gray-500">{formatDateTime(invoice.generatedAt)}</p>
                  </div>
                </div>
                
                {invoice.sentAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sent</p>
                      <p className="text-xs text-gray-500">{formatDateTime(invoice.sentAt)}</p>
                    </div>
                  </div>
                )}
                
                {invoice.paidAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Paid</p>
                      <p className="text-xs text-gray-500">{formatDateTime(invoice.paidAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Financial Breakdown (Admin Only) */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Financial Breakdown</CardTitle>
              <CardDescription>
                Commission and cashback tracking (not shown on client invoice)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gross Invoice Amount:</span>
                  <span className="font-medium">£{invoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Agent Cashback (15%):</span>
                  <span className="font-medium text-purple-600">£{invoice.agentCashback.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clerk Commission (30%):</span>
                  <span className="font-medium text-blue-600">£{invoice.clerkCommission.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Net Revenue (55%):</span>
                  <span className="font-medium text-green-600">£{invoice.netAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}