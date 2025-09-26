import React, { useState } from 'react';
import { useAuth } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { DataProtectionPolicy } from '../privacy/DataProtectionPolicy';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { LogOut, User, Settings, Shield, Cookie } from 'lucide-react';
import { cookieUtils } from '../../utils/cookieUtils';
import { toast } from 'sonner';
import logo from 'figma:asset/986a73a91c6767973e6099d0209fb5ba9215daa2.png';


export function Header() {
  const { user, logout } = useAuth();
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'clerk': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="flex justify-between items-center h-14 sm:h-16">
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            {/* Company Logo */}
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="AB Property Inspection Services" 
                className="h-8 sm:h-10 w-auto"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Role Badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-gradient-purple text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              {/* Privacy Policy */}
              <DropdownMenuItem 
                className="cursor-pointer"
                onSelect={() => setShowPrivacyPolicy(true)}
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Privacy Policy</span>
              </DropdownMenuItem>
              
              {/* Cookie Settings - Only for agents and clerks */}
              {(user.role === 'agent' || user.role === 'clerk') && (
                <Dialog open={showCookieSettings} onOpenChange={setShowCookieSettings}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Cookie className="mr-2 h-4 w-4" />
                      <span>Cookie Preferences</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cookie className="h-5 w-5 text-purple-600" />
                        Cookie Settings
                      </DialogTitle>
                      <DialogDescription>
                        Manage your cookie preferences and view current settings
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Current Preferences</h4>
                        {(() => {
                          const preferences = cookieUtils.getPreferences();
                          const consentDate = cookieUtils.getConsentDate();
                          
                          if (!preferences) {
                            return (
                              <p className="text-sm text-gray-600">
                                No cookie preferences set. Please accept or decline cookies to continue.
                              </p>
                            );
                          }
                          
                          return (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className={`p-2 rounded ${preferences.necessary ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  Essential: {preferences.necessary ? 'Enabled' : 'Disabled'}
                                </div>
                                <div className={`p-2 rounded ${preferences.functional ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                  Functional: {preferences.functional ? 'Enabled' : 'Disabled'}
                                </div>
                                <div className={`p-2 rounded ${preferences.analytics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                  Analytics: {preferences.analytics ? 'Enabled' : 'Disabled'}
                                </div>
                                <div className={`p-2 rounded ${preferences.marketing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                  Marketing: {preferences.marketing ? 'Enabled' : 'Disabled'}
                                </div>
                              </div>
                              {consentDate && (
                                <p className="text-xs text-gray-500">
                                  Last updated: {consentDate.toLocaleDateString('en-GB')}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={() => {
                            cookieUtils.clearConsent();
                            setShowCookieSettings(false);
                            toast.info('Cookie preferences cleared. Please refresh the page.');
                            setTimeout(() => window.location.reload(), 2000);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Reset Cookie Preferences
                        </Button>
                        <Button 
                          onClick={() => setShowCookieSettings(false)}
                          size="sm"
                          className="w-full bg-gradient-purple hover:bg-gradient-purple-dark text-white border-0"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
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
          <DataProtectionPolicy standalone={true} />
        </DialogContent>
      </Dialog>
    </header>
  );
}