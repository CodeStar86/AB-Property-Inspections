import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  Eye, 
  Lock, 
  FileText, 
  Users, 
  Clock, 
  Mail, 
  Phone,
  Building,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DataProtectionPolicyProps {
  trigger?: React.ReactNode;
  standalone?: boolean;
}

export function DataProtectionPolicy({ trigger, standalone = false }: DataProtectionPolicyProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="text-purple-700 border-purple-200 hover:bg-purple-50">
      <Shield className="h-4 w-4 mr-2" />
      Privacy Policy
    </Button>
  );

  const content = (
    <ScrollArea className="h-[70vh] pr-4">
      <div className="space-y-6 py-4">
            
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  AB Property Inspection Services ("we," "our," or "us") is committed to protecting your privacy and 
                  ensuring the security of your personal data. This Privacy Policy explains how we collect, use, 
                  process, and protect your information when you use our property inspection management platform.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    GDPR Compliant
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    UK DPA 2018
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    ISO 27001 Standards
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Data We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                  Data We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Personal Information</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Full name and contact details</li>
                      <li>Email address and phone number</li>
                      <li>Professional credentials and certifications</li>
                      <li>Employment and role information</li>
                      <li>Bank details for payments (encrypted)</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Property & Inspection Data</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Property addresses and details</li>
                      <li>Inspection reports and photographs</li>
                      <li>Scheduling and appointment data</li>
                      <li>Financial transaction records</li>
                      <li>Communication logs and notes</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Technical Information</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Device information and browser type</li>
                    <li>IP address and location data (if permitted)</li>
                    <li>Usage analytics and performance metrics</li>
                    <li>Session data and authentication tokens</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                  How We Use Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Service Provision</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Managing inspection bookings and scheduling</li>
                      <li>Processing payments and commissions</li>
                      <li>Generating inspection reports</li>
                      <li>User authentication and account management</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Business Operations</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Quality assurance and service improvement</li>
                      <li>Compliance and regulatory reporting</li>
                      <li>Financial accounting and invoicing</li>
                      <li>Customer support and communication</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Basis for Processing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5 text-red-600" />
                  Legal Basis for Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Contractual Necessity</p>
                      <p className="text-sm text-gray-600">Processing required to fulfill our service agreements with agents, clerks, and property owners.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Legitimate Interests</p>
                      <p className="text-sm text-gray-600">Business operations, service improvement, and fraud prevention.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Legal Compliance</p>
                      <p className="text-sm text-gray-600">Meeting regulatory requirements for property inspections and financial transactions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Consent</p>
                      <p className="text-sm text-gray-600">Analytics, marketing communications, and optional features (can be withdrawn anytime).</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sharing & Third Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-orange-600" />
                  Data Sharing & Third Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    We never sell your personal data to third parties. Data sharing is limited to essential service providers with appropriate safeguards.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Authorized Third Parties</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li><strong>Supabase:</strong> Database hosting and authentication (EU-based infrastructure)</li>
                    <li><strong>Payment Processors:</strong> Secure payment processing with PCI DSS compliance</li>
                    <li><strong>Cloud Storage:</strong> Encrypted document and image storage</li>
                    <li><strong>Email Services:</strong> Transactional emails and notifications</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Legal Disclosures</h4>
                  <p className="text-sm text-gray-700">
                    We may disclose personal data when required by law, court order, or to protect our legal rights and the safety of our users.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Your Rights Under GDPR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Right of Access</p>
                        <p className="text-sm text-gray-600">Request a copy of your personal data</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Right to Rectification</p>
                        <p className="text-sm text-gray-600">Correct inaccurate or incomplete data</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Right to Erasure</p>
                        <p className="text-sm text-gray-600">Request deletion of your data</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Right to Portability</p>
                        <p className="text-sm text-gray-600">Export your data in a common format</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Right to Object</p>
                        <p className="text-sm text-gray-600">Object to processing for marketing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Right to Restrict</p>
                        <p className="text-sm text-gray-600">Limit how we process your data</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">User Account Data</span>
                    <Badge variant="outline">Until account deletion</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Inspection Reports</span>
                    <Badge variant="outline">7 years (legal requirement)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Financial Records</span>
                    <Badge variant="outline">7 years (legal requirement)</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Analytics Data</span>
                    <Badge variant="outline">2 years</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Measures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5 text-red-600" />
                  Security Measures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Technical Safeguards</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>End-to-end encryption for data transmission</li>
                      <li>Encrypted data storage with AES-256</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>Multi-factor authentication</li>
                      <li>Automated backup and disaster recovery</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Organizational Measures</h4>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Role-based access controls</li>
                      <li>Employee privacy training</li>
                      <li>Data processing agreements with vendors</li>
                      <li>Regular privacy impact assessments</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                  Contact & Complaints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Data Protection Officer</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a href="mailto:dpo@abpropertyinspections.co.uk" className="text-purple-600 hover:underline">
                          dpo@abpropertyinspections.co.uk
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>+44 20 7123 4567</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Supervisory Authority</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>Information Commissioner's Office (ICO)</p>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>0303 123 1113</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Policy Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">
                  This privacy policy may be updated periodically to reflect changes in our practices or legal requirements. 
                  We will notify you of material changes through the app or via email.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {new Date().toLocaleDateString('en-GB', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </CardContent>
            </Card>

          </div>
    </ScrollArea>
  );

  if (standalone) {
    return content;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-purple-600" />
            Data Protection & Privacy Policy
          </DialogTitle>
          <DialogDescription>
            AB Property Inspection Services - Effective Date: {new Date().toLocaleDateString('en-GB')}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}