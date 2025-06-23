import React, { useState } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Info, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const CalibrationPhase: React.FC = () => {
  const { state, updateCalibrationData, goToNextPhase, goToPreviousPhase } = useWorkflow();
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);
  const [circleSize, setCircleSize] = useState(20);
  const [exposureMask, setExposureMask] = useState({
    enabled: true,
    value: 0,
  });
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const handleCalibrate = () => {
    // In real implementation, this would capture the calibration data
    updateCalibrationData({
      isCompleted: true,
      circles: [
        // This would come from the actual calibration canvas
        { x: 100, y: 100, size: circleSize },
        { x: 200, y: 150, size: circleSize },
      ],
      exposureMask,
    });
    goToNextPhase();
  };

  const handleSkip = () => {
    setIsSkipDialogOpen(false);
    updateCalibrationData({
      skipped: true,
      isCompleted: false,
    });
    goToNextPhase();
  };

  const handleExposureMaskingToggle = (checked: boolean) => {
    setExposureMask(prev => ({
      ...prev,
      enabled: checked,
    }));
  };

  const handleExposureMaskingValue = (value: number[]) => {
    setExposureMask(prev => ({
      ...prev,
      value: value[0],
    }));
  };

  return (
    <div className="px-6 py-4 w-full max-w-4xl mx-auto bg-[#ecedef]">
      <p className="text-center text-sm text-gray-600 font-manrope font-extralight mb-3">Position 3-5 Calibration Circles in the middle of the Shade Tab</p>
      <div 
        className="border border-dotted border-gray-500 rounded-lg p-0 cursor-pointer bg-transparent relative overflow-hidden"
      >
        {/* Content area */}
        <div className="px-8 pt-8 pb-4 relative z-0">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1">
              <h3 className="text-lg text-black font-manrope font-light mb-2">Calibration Canvas</h3>
            </div>
            
            <div className="flex-1 flex justify-center items-center mt-6 md:mt-0">
              <div className="flex flex-col items-center justify-center h-40 opacity-80">
              </div>
            </div>
          </div>
        </div>
        
        {/* Overlay with the same style as upload phase */}
        <div 
          className="absolute inset-0 bg-[#ecedef] opacity-30 pointer-events-none z-10"
        />
      </div>    
        
      {/* Calibration Circle Size */}
      <div className="mt-4 mb-3 rounded-lg bg-transparent relative">
        <div className="px-4 pt-3 pb-2 relative z-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base text-black font-manrope font-light">Calibration Circle Size</h3>
            <span className="text-sm text-black font-manrope font-extralight">{circleSize}px</span>
          </div>
          
          <Slider
            value={[circleSize]}
            min={5}
            max={50}
            step={1}
            onValueChange={(value) => setCircleSize(value[0])}
            className="w-full"
          />
        </div>
        
        {/* Overlay with the same style as main canvas */}

      </div>
      
      {/* Exposure Masking Controls */}
      <div className="rounded-lg mt-2 bg-transparent relative">
        <div className="px-4 pt-2 pb-2 relative z-0">
          {/* Threshold slider only */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="exposure-threshold" className="text-base text-black font-manrope font-light">Exposure Mask: Hides over/underexposed areas</Label>
              <span className="text-sm text-black font-manrope font-extralight">{exposureMask.value}%</span>
            </div>
            <Slider
              id="exposure-threshold"
              value={[exposureMask.value]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleExposureMaskingValue}
            />
          </div>
        </div>

      </div>
      
      {/* Combined action buttons and navigation buttons */}
      <div className="mt-6 flex flex-col gap-1">
        {/* First row: action buttons */}
        <div className="flex justify-between">
          <div>
            <button
              onClick={() => setIsSkipDialogOpen(true)}
              className="px-4 py-2 rounded-md border border-gray-300 transition-colors text-gray-800 bg-white hover:bg-gray-100 font-manrope font-light"
            >
              Skip Calibration
            </button>
          </div>
          <div>
            <button 
              onClick={handleCalibrate}
              className="px-4 py-2 rounded-md transition-colors bg-gray-800 hover:bg-gray-700 text-white font-manrope font-light flex items-center"
            >
              Complete Calibration
            </button>
          </div>
        </div>
        
        {/* Second row: navigation buttons */}
        <div className="flex justify-between">
          <div>
            {state.canGoBack && (
              <button
                onClick={goToPreviousPhase}
                className="flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 transition-colors font-manrope font-light"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
            )}
          </div>
          <div>
            {state.canProceed && (
              <button
                onClick={goToNextPhase}
                className="flex items-center px-4 py-2 rounded-md transition-colors bg-gray-800 hover:bg-gray-700 text-white font-manrope font-light"
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Skip Dialog */}
      <Dialog open={isSkipDialogOpen} onOpenChange={setIsSkipDialogOpen}>
        <DialogContent className="bg-[#ECEDEF] border-0">
          <DialogHeader>
            <DialogTitle className="text-black font-manrope font-extralight">Skip Calibration?</DialogTitle>
            <DialogDescription className="text-black font-manrope font-extralight">
              Skipping calibration may reduce the accuracy of color analysis.
              Are you sure you want to proceed without calibration?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button 
              onClick={() => setIsSkipDialogOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-black font-manrope font-light transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSkip}
              className="px-4 py-2 rounded-md bg-white hover:bg-gray-100 text-black font-manrope font-light border border-gray-300 transition-colors ml-2"
            >
              Skip Calibration
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="bg-[#ECEDEF] border-0">
          <DialogHeader>
            <DialogTitle className="text-black font-manrope font-extralight">Calibration Circle Size</DialogTitle>
            <DialogDescription className="text-black font-manrope font-extralight">
              Adjust the size of calibration circles to match the shade tabs in your image.
              For accurate results, place calibration circles on VITA shade tabs with known values.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="font-medium text-sm mb-2">Tips for accurate calibration:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Place circles on the middle third of shade tabs</li>
              <li>Use at least 2-3 different shade tabs for best results</li>
              <li>Avoid areas with glare or shadows</li>
            </ul>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setInfoDialogOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-black font-manrope font-light transition-colors"
            >
              Got it
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalibrationPhase;
