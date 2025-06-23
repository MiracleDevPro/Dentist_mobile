import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';

interface ExposureMaskingState {
  enabled: boolean;
  value: number;
}

interface AnalysisExposureMaskProps {
  state: ExposureMaskingState;
  onChange: (state: ExposureMaskingState) => void;
  className?: string;
}

export const AnalysisExposureMask: React.FC<AnalysisExposureMaskProps> = ({
  state,
  onChange,
  className = '',
}) => {
  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false);

  const handleToggleChange = (checked: boolean) => {
    onChange({ ...state, enabled: checked });
  };

  const handleValueChange = (value: number[]) => {
    onChange({ ...state, value: value[0] });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="analysis-exposure-masking" className="font-medium">
            Exposure Masking
          </Label>
          <button
            type="button"
            onClick={() => setInfoDialogOpen(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">About Exposure Masking</span>
          </button>
        </div>
        <Switch
          id="analysis-exposure-masking"
          checked={state.enabled}
          onCheckedChange={handleToggleChange}
          aria-label="Toggle exposure masking"
        />
      </div>

      {state.enabled && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <Label htmlFor="analysis-exposure-threshold" className="text-sm text-gray-500">
              Threshold
            </Label>
            <span className="text-sm font-medium">{state.value}%</span>
          </div>
          <Slider
            id="analysis-exposure-threshold"
            min={0}
            max={100}
            step={1}
            value={[state.value]}
            onValueChange={handleValueChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Adjust the threshold to highlight areas with optimal exposure for color analysis.
          </p>
        </div>
      )}

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-manrope text-gray-900">Analysis Exposure Masking</DialogTitle>
            <DialogDescription className="text-gray-500">
              Highlight areas with optimal exposure for accurate color analysis
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h4 className="font-medium mb-2">What is Analysis Exposure Masking?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Analysis exposure masking helps identify areas of the tooth that have proper exposure 
              for accurate color analysis. The mask highlights areas that are neither overexposed 
              nor underexposed, ensuring the most reliable color matching results.
            </p>

            <h4 className="font-medium mb-2">Analysis Phase Usage</h4>
            <p className="text-sm text-gray-600 mb-2">
              During color analysis, use exposure masking to:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 mb-4">
              <li>Sample colors only from properly exposed tooth areas</li>
              <li>Avoid analyzing overexposed areas (often appearing as white spots)</li>
              <li>Skip underexposed areas that may appear darker than the actual tooth shade</li>
              <li>Focus on the middle third of the tooth for most consistent results</li>
            </ul>

            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Pro tip:</strong> Analysis exposure settings are independent from calibration 
                exposure settings. You can optimize each phase independently for best results.
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
