import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MobileCard } from './MobileLayout';
import { AnalysisExposureMask } from './AnalysisExposureMask';
import { Info, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useWorkflow } from '@/contexts/WorkflowContext';

interface AnalysisControlsProps {
  onBackToCalibration: () => void;
  className?: string;
}

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  onBackToCalibration,
  className = '',
}) => {
  const { state, updateAnalysisData } = useWorkflow();
  const [circleSize, setCircleSize] = useState(15);
  const [exposureMask, setExposureMask] = useState({
    enabled: state.analysisData.exposureMask.enabled,
    value: state.analysisData.exposureMask.value,
  });
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const handleCircleSizeChange = (value: number[]) => {
    const newSize = value[0];
    setCircleSize(newSize);
    // In a real implementation, this would update the analysis circle size
  };

  const handleExposureMaskingChange = (newState: { enabled: boolean; value: number }) => {
    setExposureMask(newState);
    updateAnalysisData({ exposureMask: newState });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <MobileCard title="Analysis Controls">
        <div className="space-y-6">
          {/* Analysis Circle Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="analysis-circle-size" className="font-medium">
                  Analysis Circle Size
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
              id="analysis-circle-size"
              min={5}
              max={50}
              step={1}
              onValueChange={handleCircleSizeChange}
            />
            <p className="text-xs text-gray-500 mt-1" >
              Adjust circle size for analysis points
            </p>
          </div>

          {/* Analysis Exposure Masking */}
          <div className="border-t border-gray-200 pt-4">
            <AnalysisExposureMask
              state={exposureMask}
              onChange={handleExposureMaskingChange}
            />
          </div>

          {/* Back to Calibration Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={onBackToCalibration}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Calibration
            </Button>
          </div>
        </div>
      </MobileCard>

      {/* Circle Size Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-manrope text-gray-900">Analysis Circle Size</DialogTitle>
            <DialogDescription className="text-gray-500">
              Setting the right sampling area for color analysis
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h4 className="font-medium mb-2">How to Set Analysis Circle Size</h4>
            <p className="text-sm text-gray-600 mb-4">
              The analysis circle determines how large an area is sampled for each color measurement.
              Smaller circles give more precise results for specific areas, while larger circles provide
              more averaged color values.
            </p>

            <h4 className="font-medium mb-2">Best Practices</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 mb-4">
              <li>Use smaller circles (10-15px) for precise measurements</li>
              <li>Use larger circles (20-30px) for averaged areas</li>
              <li>Focus on the middle third of the tooth for most consistent results</li>
              <li>Take multiple measurements for more accurate shade matching</li>
              <li>Avoid edges, shadows, stains, and highlights</li>
            </ul>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Take readings from cervical, middle, and incisal thirds of the
                tooth to map shade distribution.
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
    </div>
  );
};
