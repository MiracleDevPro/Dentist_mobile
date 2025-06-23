import React, { useState } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw, ChevronDown, Sparkles, Copy, Check, Info } from 'lucide-react';
import { Share, List, CopySimple } from 'phosphor-react';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { WorkflowStepper } from './WorkflowStepper';
import { useToast } from '@/hooks/use-toast';

// Import the actual phase components
import UploadPhase from '@/components/phases/UploadPhase';
import CalibrationPhase from '@/components/phases/CalibrationPhase';
import AnalysisPhase from '@/components/phases/AnalysisPhase';
import ResultsPhase from '@/components/phases/ResultsPhase';

export const PhaseManager: React.FC = () => {
  const { state, goToNextPhase, goToPreviousPhase, resetWorkflow } = useWorkflow();
  const { toast } = useToast();

  // Handle copy link to clipboard with toast notification
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this link with others"
    });
  };

  // Phase component rendering based on current phase
  const renderPhaseContent = () => {
    switch (state.currentPhase) {
      case 'upload':
        return <UploadPhase />;
      case 'calibration':
        return <CalibrationPhase />;
      case 'analysis':
        return <AnalysisPhase />;
      case 'results':
        return <ResultsPhase />;
      default:
        return null;
    }
  };
  
  // Function to determine if back button should be shown
  const showBackButton = () => {
    return state.currentPhase !== 'upload' && state.canGoBack;
  };
  
  // Function to determine if next button should be shown
  const showNextButton = () => {
    return state.currentPhase !== 'results' && state.canProceed;
  };

  return (
    <div className="min-h-screen bg-[#ecedef] flex flex-col w-full p-0">
      {/* App title and reset button - always visible */}
      <div className="flex justify-center bg-[#ecedef] border-b border-[#ecedef] w-full py-5">
        <div className="flex items-center justify-between w-full max-w-3xl px-6">
          <div>
            <img 
              src="/images/ts-mobile.svg" 
              alt="ToothShade" 
              className="h-8 block" 
            />
            <p className="text-xs text-black font-manrope font-extralight ml-0 mt-[-2px]">A Dental Shade Matching tool</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="text-gray-500"
              title="Copy"
              onClick={handleCopy}
            >
              <img src="/images/link-simple-thin.svg" alt="Copy Link" width="22" height="22" />
            </button>
            <button 
              className="text-gray-500"
              title="Share"
              onClick={handleCopy}
            >
              <img src="/images/share-fat-thin.svg" alt="Share" width="22" height="22" />
            </button>
            <button 
              className="text-gray-500"
              title="Menu"
            >
              <img src="/images/list-thin.svg" alt="Menu" width="22" height="22" />
            </button>
          </div>
        </div>
      </div>

      {/* Stepper - Only shown after upload - Consistent across all screen sizes */}
      {state.currentPhase !== 'upload' && (
        <div className="px-6 pt-4 max-w-3xl mx-auto w-full">
          <WorkflowStepper currentPhase={state.currentPhase} />
        </div>
      )}

      {/* Main content area - Single window for all phases with responsive scaling */}
      <div className="flex-1 overflow-y-auto w-full flex justify-center">
        <div className="transition-all duration-300 transform w-full max-w-3xl mx-auto">
          {renderPhaseContent()}
        </div>
      </div>

      {/* Navigation controls - fixed at bottom (hidden on upload, calibration, and analysis phases) */}
      {state.currentPhase !== 'upload' && state.currentPhase !== 'calibration' && state.currentPhase !== 'analysis' && (
        <div className="pt-0 pb-1 px-6 flex justify-between bg-[#ecedef] -mt-10">
          <div>
            {showBackButton() ? (
              <button
                onClick={goToPreviousPhase}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 transition-colors font-manrope font-light"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
            ) : (
              <div></div> /* Empty div to maintain spacing */
            )}
          </div>
          
          <div>
            {showNextButton() ? (
              <button
                onClick={goToNextPhase}
                disabled={!state.canProceed}
                className={`
                  flex items-center px-4 py-2 rounded-md transition-colors font-manrope font-light
                  ${!state.canProceed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'}
                `}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : state.currentPhase === 'results' ? (
              <button
                onClick={resetWorkflow}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 transition-colors font-manrope font-light"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Start New
              </button>
            ) : (
              <div></div> /* Empty div to maintain flex spacing */
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder loading component
const PhaseLoading = () => (
  <div className="w-full h-40 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-t-gray-800 border-b-gray-300 border-l-gray-300 border-r-gray-300 rounded-full animate-spin mx-auto"></div>
      <p className="mt-2 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);
