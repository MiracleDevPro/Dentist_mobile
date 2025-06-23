
import React, { useState, useEffect } from 'react';
import { Moon, Sun, List, Archive, Share, SignIn, SignOut, DeviceMobile } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const AppHeader: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /iphone|ipad|ipod|android|blackberry|windows phone|opera mini|silk/i.test(userAgent);
      setIsMobileDevice(mobile || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Navigate to mobile workflow
  const goToMobileWorkflow = () => {
    navigate('/mobile');
    toast({
      title: "Mobile Workflow",
      description: "Switched to mobile-optimized workflow",
    });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    toast({
      title: "Logged In",
      description: "Welcome back to Tooth Color Matcher",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Current page link copied to clipboard",
    });
  };

  const handleArchive = () => {
    toast({
      title: "Archive",
      description: "Opening previous cases archive",
    });
  };

  return (
    <header className="bg-[#ecedef] text-black relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/ts.svg" 
              alt="ToothShade" 
              style={{ height: '28px' }} 
              className="w-auto object-contain"
            />
            <span className="text-sm manrope-light">A Dental Shade Matching tool</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mobile Workflow Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToMobileWorkflow}
              className="text-gray-800 hover:bg-gray-100 h-10 w-10 rounded-xl border border-gray-200 relative"
            >
              <DeviceMobile weight="duotone" className="w-5 h-5" />
              {isMobileDevice && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </Button>
            
            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyLink}
              className="text-gray-800 hover:bg-gray-100 h-10 w-10 rounded-xl border border-gray-200"
            >
              <Share weight="duotone" className="w-5 h-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-800 hover:bg-gray-100 h-10 w-10 rounded-xl border border-gray-200"
                >
                  <List weight="duotone" className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border border-gray-200">
                <DropdownMenuLabel className="text-gray-800">Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={goToMobileWorkflow} className="cursor-pointer">
                  <DeviceMobile weight="duotone" className="mr-2 h-4 w-4 text-gray-700" />
                  <span>Mobile Workflow</span>
                  {isMobileDevice && (
                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {isLoggedIn ? (
                  <>
                    <DropdownMenuItem onClick={handleArchive} className="cursor-pointer">
                      <Archive weight="duotone" className="mr-2 h-4 w-4 text-gray-700" />
                      <span>Previous Cases</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <SignOut weight="duotone" className="mr-2 h-4 w-4 text-gray-700" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleLogin} className="cursor-pointer">
                    <SignIn weight="duotone" className="mr-2 h-4 w-4 text-gray-700" />
                    <span>Log In</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
