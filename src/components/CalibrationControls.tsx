import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MobileCard } from './MobileLayout';
import { CalibrationExposureMask } from './CalibrationExposureMask';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useWorkflow } from '@/contexts/WorkflowContext';

interface CalibrationControlsProps {
  onCalibrate: () => void;
  onSkip: () => void;
  className?: string;
}

export const CalibrationControls: React.FC<CalibrationControlsProps> = ({
  onCalibrate,
  onSkip,
  className = '',
}) => {
  const { state, updateCalibrationData } = useWorkflow();
  const [circleSize, setCircleSize] = useState(state.calibrationData.circles[0]?.size || 20);
  const [exposureMask, setExposureMask] = useState({
    enabled: state.calibrationData.exposureMask.enabled,
    value: state.calibrationData.exposureMask.value,
  });
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);

  const handleCircleSizeChange = (value: number[]) => {
    const newSize = value[0];
    setCircleSize(newSize);
    
    // Update all calibration circles with the new size
    const updatedCircles = state.calibrationData.circles.map(circle => ({
      ...circle,
      size: newSize,
    }));
    
    updateCalibrationData({ circles: updatedCircles });
  };

  const handleExposureMaskingChange = (newState: { enabled: boolean; value: number }) => {
    setExposureMask(newState);
    updateCalibrationData({ exposureMask: newState });
  };

  const handleSkip = () => {
    setSkipDialogOpen(false);
    onSkip();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <MobileCard title="Calibration Controls">
        <div className="space-y-6">
          {/* Circle Size Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="circle-size" className="font-medium">
                  Calibration Circle Size
                </Label>
                <button
                  type="button"
                  onClick={() => setInfoDialogOpen(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm font-medium">{circleSize}px</span>
            </div>
            <Slider
              id="circle-size"
              min={5}
              max={50}
              step={1}
              value={[circleSize]}
              onValueChange={handleCircleSizeChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Adjust circle size to fit within shade tabs
            </p>
          </div>

          {/* Exposure Masking Control */}
          <div className="border-t border-gray-200 pt-4">
            <CalibrationExposureMask
              state={exposureMask}
              onChange={handleExposureMaskingChange}
            />
          </div>
        </div>
      </MobileCard>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setSkipDialogOpen(true)}
        >
          Skip Calibration
        </Button>
        <Button onClick={onCalibrate}>
          Calibrate
        </Button>
      </div>

      {/* Circle Size Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-manrope text-gray-900">
              Calibration Circle Size
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Setting the right size for accurate calibration
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h4 className="font-medium mb-2">How to Set Circle Size</h4>
            <p className="text-sm text-gray-600 mb-4">
              Adjust the circle size so that it fits comfortably within the body of the VITA shade tabs in
              your reference image. The circle should not extend beyond the edges of the shade tab.
            </p>

            <h4 className="font-medium mb-2">Best Practices</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 mb-4">
              <li>Place circles on the middle third of shade tabs</li>
              <li>Avoid edges, shadows, and highlights</li>
              <li>Use 2-3 different shade tabs for best calibration results</li>
              <li>Include shades similar to the target tooth</li>
            </ul>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Using known shade guides like VITA Classical or 3D-Master will
                provide the most accurate calibration results.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setInfoDialogOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Calibration Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-manrope text-red-600">Skip Calibration?</DialogTitle>
            <DialogDescription className="text-gray-500">
              Skipping calibration may reduce accuracy
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              Calibration helps ensure accurate color matching by setting reference points based on
              known shade guide samples in your image.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Without calibration, color analysis will still work but may be less accurate due to
              variations in lighting conditions, camera settings, and white balance.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> For clinical applications requiring high precision shade
                matching, calibration is strongly recommended.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSkip}>
              Skip Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
