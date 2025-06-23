import React, { useState } from 'react';
import { useFeatures } from '@/contexts/FeaturesContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ExposureMaskingToggleProps {
  className?: string;
}

const ExposureMaskingToggle: React.FC<ExposureMaskingToggleProps> = ({ className = '' }) => {
  const { features, toggleFeature } = useFeatures();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center">
        <label htmlFor="exposure-masking-toggle" className="mr-2 text-sm font-medium text-gray-700">
          Exposure Masking
        </label>

      </div>
      
      <div className="relative inline-block w-10 mr-2 align-middle select-none">
        <input
          type="checkbox"
          id="exposure-masking-toggle"
          className="sr-only peer"
          checked={features.useExposureMasking}
          onChange={() => toggleFeature('useExposureMasking')}
        />
        <label
          htmlFor="exposure-masking-toggle"
          className="block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer peer-checked:bg-gray-400 transition-all duration-200"
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
              features.useExposureMasking ? 'translate-x-4' : 'translate-x-0'
            }`}
          ></span>
        </label>
      </div>
    </div>
  );
};

export default ExposureMaskingToggle;
