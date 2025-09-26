import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Shield, Key, Server, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { config, getEnvironmentInfo, maskSensitiveData } from '../../utils/config';

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState(getEnvironmentInfo());

  const refreshSecurityInfo = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setEnvironmentInfo(getEnvironmentInfo());
    setIsRefreshing(false);
  };

  const getSecurityScore = () => {
    let score = 0;
    let total = 0;

    // HTTPS check
    total += 20;
    if (environmentInfo.hasSecureContext) score += 20;

    // Environment configuration
    total += 30;
    if (environmentInfo.supabaseConfigured) score += 30;

    // OpenAI configuration
    total += 20;
    try {
      const openaiKey = import.meta.env?.VITE_OPENAI_API_KEY;
      if (openaiKey && openaiKey !== 'your_openai_api_key_here' && openaiKey.startsWith('sk-')) {
        score += 20;
      }
    } catch (error) {
      console.warn('Could not access OpenAI API key for security score:', error);
    }

    // Production settings
    total += 30;
    if (environmentInfo.isProduction) {
      try {
        // In production, development tools should be disabled
        const devToolsEnabled = import.meta.env?.VITE_ENABLE_DEV_TOOLS === 'true';
        if (!devToolsEnabled) score += 15;
        
        // Analytics should be properly configured
        if (import.meta.env?.VITE_ENABLE_ANALYTICS !== 'false') score += 15;
      } catch (error) {
        console.warn('Could not access production environment variables:', error);
        score += 15; // Give partial points if we can't check
      }
    } else {
      score += 30; // Full points for development
    }

    return Math.round((score / total) * 100);
  };

  const securityScore = getSecurityScore();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-600">Good</Badge>;
    return <Badge className="bg-red-600">Needs Attention</Badge>;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Dashboard</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Security Score:</span>
                <span className={`font-bold text-lg ${getScoreColor(securityScore)}`}>
                  {securityScore}%
                </span>
                {getScoreBadge(securityScore)}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshSecurityInfo}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Security Score Alert */}
              {securityScore < 70 && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Security score is below recommended level. Please review the recommendations tab.
                  </AlertDescription>
                </Alert>
              )}

              {/* Quick Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    {environmentInfo.hasSecureContext ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Secure Context</p>
                      <p className="text-sm text-gray-600">
                        {environmentInfo.hasSecureContext ? 'HTTPS Enabled' : 'HTTPS Required'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    {environmentInfo.supabaseConfigured ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Database</p>
                      <p className="text-sm text-gray-600">
                        {environmentInfo.supabaseConfigured ? 'Configured' : 'Not Configured'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Environment</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {environmentInfo.environment}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Environment Type</span>
                  <Badge variant={environmentInfo.isDevelopment ? "outline" : "default"}>
                    {environmentInfo.environment}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Secure Context (HTTPS)</span>
                  {environmentInfo.hasSecureContext ? (
                    <Badge className="bg-green-600">Enabled</Badge>
                  ) : (
                    <Badge className="bg-red-600">Disabled</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Supabase URL</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {showSensitiveData ? 
                      ((() => {
                        try {
                          return import.meta.env?.VITE_SUPABASE_URL || 'Not configured';
                        } catch (error) {
                          return 'Could not access URL';
                        }
                      })()) : 
                      environmentInfo.supabaseUrlMasked
                    }
                  </code>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Supabase Anon Key</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {showSensitiveData ? 
                      ((() => {
                        try {
                          return import.meta.env?.VITE_SUPABASE_ANON_KEY || 'Not configured';
                        } catch (error) {
                          return 'Could not access key';
                        }
                      })()) : 
                      environmentInfo.supabaseKeyMasked
                    }
                  </code>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                  >
                    {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-4">
              <div className="space-y-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Key className="h-5 w-5" />
                      <span className="font-medium">OpenAI API Key</span>
                    </div>
                    <Badge variant={(() => {
                      try {
                        const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
                        return apiKey && apiKey !== 'your_openai_api_key_here' ? "default" : "outline";
                      } catch (error) {
                        return "outline";
                      }
                    })()}>
                      {(() => {
                        try {
                          const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
                          return apiKey && apiKey !== 'your_openai_api_key_here' ? 'Configured' : 'Not Configured';
                        } catch (error) {
                          return 'Access Error';
                        }
                      })()}
                    </Badge>
                  </div>
                  
                  {(() => {
                    try {
                      const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
                      return apiKey && apiKey !== 'your_openai_api_key_here';
                    } catch (error) {
                      return false;
                    }
                  })() ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Key Format: {(() => {
                          try {
                            const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
                            return apiKey?.startsWith('sk-') ? '✅ Valid' : '❌ Invalid';
                          } catch (error) {
                            return '❌ Cannot validate';
                          }
                        })()}
                      </p>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                        {showSensitiveData ? 
                          ((() => {
                            try {
                              return import.meta.env?.VITE_OPENAI_API_KEY || 'Not accessible';
                            } catch (error) {
                              return 'Could not access API key';
                            }
                          })()) : 
                          ((() => {
                            try {
                              const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
                              return apiKey ? maskSensitiveData(apiKey, 7) : 'Not accessible';
                            } catch (error) {
                              return 'Access error';
                            }
                          })())
                        }
                      </code>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        OpenAI API key not configured. AI features will be disabled.
                        Add VITE_OPENAI_API_KEY to your .env file.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-3">
                {!environmentInfo.hasSecureContext && (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>High Priority:</strong> Enable HTTPS for secure communication
                    </AlertDescription>
                  </Alert>
                )}

                {!environmentInfo.supabaseConfigured && (
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Medium Priority:</strong> Configure Supabase environment variables
                    </AlertDescription>
                  </Alert>
                )}

                {(!import.meta.env.VITE_OPENAI_API_KEY || 
                  import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key_here') && (
                  <Alert>
                    <AlertDescription>
                      <strong>Optional:</strong> Configure OpenAI API key to enable AI-powered room analysis
                    </AlertDescription>
                  </Alert>
                )}

                {environmentInfo.isProduction && import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' && (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Risk:</strong> Development tools are enabled in production
                    </AlertDescription>
                  </Alert>
                )}

                {securityScore >= 90 && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Excellent:</strong> Your security configuration meets all recommended standards
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityDashboard;