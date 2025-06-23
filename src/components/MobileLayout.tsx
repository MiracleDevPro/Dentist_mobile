import React, { ReactNode } from 'react';
import { WorkflowStepper } from './WorkflowStepper';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { DeviceMobile, Share, List, CopySimple } from 'phosphor-react';
import { useToast } from '@/components/ui/use-toast';

interface MobileLayoutProps {
  children: ReactNode;
  showStepper?: boolean;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showStepper = true,
  className = '',
}) => {
  const { state } = useWorkflow();
  const { toast } = useToast();
  
  const getCompletedPhases = () => {
    const completed = [];
    if (state.uploadedImage) completed.push('upload');
    if (state.calibrationData.isCompleted || state.calibrationData.skipped) completed.push('calibration');
    if (state.analysisData.analysisPoints.length > 0) completed.push('analysis');
    return completed;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this link with others"
    });
  };

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Mobile Header matching Image 1 exactly */}
      <header className="w-full bg-white py-6 px-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">ToothShade</h1>
            <p className="text-xs text-gray-500">A Dental Shade Matching tool</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="text-gray-500"
              title="Copy"
            >
              <CopySimple size={22} />
            </button>
            <button 
              className="text-gray-500"
              onClick={handleShare}
              title="Share"
            >
              <Share size={22} />
            </button>
            <button 
              className="text-gray-500"
              title="Menu"
            >
              <List size={22} />
            </button>
          </div>
        </div>
      </header>
      {/* Header with Stepper */}
      {showStepper && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <WorkflowStepper
              currentPhase={state.currentPhase}
              completedPhases={getCompletedPhases()}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Safe Area */}
      <div className="h-safe-bottom md:hidden" />
    </div>
  );
};

interface MobileCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  children,
  className = '',
  actions,
}) => {
  const noPadding = className.includes('no-padding');
  return (
    <div className={`bg-[#ecedef] rounded-lg ${className}`}>
      {title && (
        <div className="px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg text-black font-manrope font-light">{title}</h3>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 py-4'}>
        {children}
      </div>
    </div>
  );
};

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 font-manrope">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
