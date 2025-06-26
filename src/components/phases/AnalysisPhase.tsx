import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { TabSystem, TabContent } from '../TabSystem';
import { Sliders, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import ColorAnalysisCanvas from '@/components/ColorAnalysisCanvas';

const AnalysisPhase: React.FC = () => {
  const { state, updateAnalysisData, goToPreviousPhase } = useWorkflow();
  const { features, toggleFeature } = useFeatures();
  const [activeTab, setActiveTab] = useState('controls');
  const [analysisCircleSize, setAnalysisCircleSize] = useState(15);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [calibration, setCalibration] = useState<{
    meanClickedLab: { L: number; a: number; b: number };
    officialLab: { L: number; a: number; b: number };
    // Include HSV values for calibration when AI features are enabled
    meanClickedHsv?: { h: number; s: number; v: number };
    officialHsv?: { h: number; s: number; v: number };
    shade: string;
  } | null>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationShade, setCalibrationShade] = useState<string>("");
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  const [calibrationPoints, setCalibrationPoints] = useState<{ 
    L: number; a: number; b: number; 
    hsv?: { h: number; s: number; v: number } 
  }[]>([]);
  const [calibrationClickPositions, setCalibrationClickPositions] = useState<{ x: number; y: number }[]>([]);
  // Initialize exposure mask from calibration settings if available

  const [exposureMask, setExposureMask] = useState({
    enabled: true,
    value: state.calibrationData?.exposureMask?.value || 50,
  });

  // Calculate active AI features count
  const featureCount = useMemo(() => {
    const aiFeatures = [
      features.useHSV,
      features.useWeightedDeltaE,
      features.useClinicalSuggestions
    ];
    return {
      active: aiFeatures.filter(Boolean).length,
      total: aiFeatures.length
    };
  }, [features.useHSV, features.useWeightedDeltaE, features.useClinicalSuggestions]);

  const handleExposureMaskingToggle = (checked: boolean) => {
    setExposureMask(prev => ({
      ...prev,
      enabled: checked,
    }));
    
    // In real implementation, this would update the analysis canvas
    updateAnalysisData({
      exposureMask: {
        ...exposureMask,
        enabled: checked,
      }
    });
  };

  const handleExposureMaskingValue = (value: number[]) => {
    const newValue = value[0];
    setExposureMask(prev => ({
      ...prev,
      value: newValue,
    }));
    
    // Only update analysis data, not calibration data
    updateAnalysisData({
      exposureMask: {
        ...exposureMask,
        value: newValue,
      }
    });
  };

  const handlePixelSelect = (pixelData: any) => {
    setSelectedPixelData(pixelData);
  };

  const uploadedImageUrl = state.uploadedImage ? URL.createObjectURL(state.uploadedImage) : null;

    // Effect to initialize exposure mask from calibration data ONLY once on component mount
  useEffect(() => {
    if (state.calibrationData?.exposureMask) {
      setExposureMask({
        enabled: true, 
        value: state.calibrationData.exposureMask.value
      });
    }
  }, []);  // Empty dependency array means this only runs once on mount

  useEffect(() => {
    setSelectedImage(uploadedImageUrl);
  }, []);
  return (
    <div className="px-6 py-4 w-full max-w-4xl mx-auto bg-[#ecedef]">
      <p className="text-center text-sm text-gray-600 font-manrope font-extralight mb-3">Place The Circle in order to see the Shade</p>
      {/* This would be replaced with the actual analysis canvas */}
      {/* Main Analysis Canvas */}
        {selectedImage ? (
          <div className="relative w-full flex justify-center mb-10">      
            <div className="relative" style={{ maxWidth: "100%", margin: '0 auto' }}>
              <ColorAnalysisCanvas
                imageUrl={selectedImage}
                onPixelSelect={handlePixelSelect}
                calibrationLab={calibration ? { clickedLab: calibration.meanClickedLab, officialLab: calibration.officialLab } : undefined}
                calibration={calibration}
                calibrationClickPositions={calibrationClickPositions}
              />
                {calibrationPoints.length > 5 && (
                  <span className="text-xs text-red-700 mt-2 block">Maximum 5 calibration points allowed.</span>
                )}
            </div>
          </div>
          ) : (
            <div className="flex items-center justify-center h-96 rounded-2xl border-2 border-gray-400 bg-[#ecedef]/80">
              <div className="text-center">
                <p className="text-slate-600 text-lg">Please upload an image in the panel above to begin analysis</p>
              </div>
            </div>
        )}
      
      {/* Tab Navigation */}
      <div className="relative">
        <TabSystem
          tabs={[
            { id: 'controls', label: 'Controls', icon: <Sliders className="w-[18px] h-[18px]" /> },
            { 
              id: 'ai-features', 
              label: 'AI Features', 
              icon: <img src="/images/robot-thin.svg" className="w-[18px] h-[18px]" alt="AI Features" />,
              badge: (
                <div 
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap mt-1",
                    featureCount.active > 0 ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                  )}
                >
                  {featureCount.active > 0 
                    ? `Active ${featureCount.active}/${featureCount.total}` 
                    : "Not Active"}
                </div>
              )
            },
            { id: 'analysis', label: 'Details', icon: <img src="/images/magnifying-glass-thin.svg" className="w-[18px] h-[18px]" alt="Details" /> },
            { id: 'suggestions', label: 'Suggestions', icon: <Lightbulb className="w-[18px] h-[18px]" /> },
          ]}
          defaultTab="controls"
          onChange={setActiveTab}
          className="mb-3"
        />
      </div>
      
      {/* Tab Contents */}
      <TabContent active={activeTab === 'controls'}>
        <div className="mt-4 mb-2 bg-transparent relative">
          <div className="px-4 py-2 relative z-0">
            <h3 className="text-lg text-black font-manrope font-light mb-3">Analysis Controls</h3>
            <div className="space-y-4">
              {/* Analysis Circle Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="analysis-circle-size" className="text-base text-black font-manrope font-light">Analysis Circle Size</Label>
                  <span className="text-sm text-black font-manrope font-extralight">{analysisCircleSize}px</span>
                </div>
                <Slider
                  id="analysis-circle-size"
                  value={[analysisCircleSize]}
                  min={5}
                  max={50}
                  step={1}
                  onValueChange={(value) => setAnalysisCircleSize(value[0])}
                />
              </div>
              
              {/* Analysis Exposure Masking */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="analysis-exposure-threshold" className="text-base text-black font-manrope font-light">Exposure Mask: Hides over/underexposed areas</Label>
                  <span className="text-sm text-black font-manrope font-extralight">{exposureMask.value}%</span>
                </div>
                <Slider
                  id="analysis-exposure-threshold"
                  value={[exposureMask.value]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleExposureMaskingValue}
                />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-[#ecedef] opacity-30 pointer-events-none z-10"></div>
        </div>
        
        <div className="mt-4 flex justify-start">
          <button
            onClick={goToPreviousPhase}
            className="flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 transition-colors font-manrope font-light"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        </div>
      </TabContent>
      
      <TabContent active={activeTab === 'ai-features'}>
        <div className="border border-dotted border-gray-500 rounded-lg mt-4 mb-2 bg-transparent relative overflow-hidden">
          <div className="px-6 py-4 relative z-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg text-black font-manrope font-light">AI Features</h3>
              <div className="flex items-center">
                <Label htmlFor="ai-master-toggle" className="mr-2 text-black text-sm">ALL AI</Label>
                <Switch 
                  id="ai-master-toggle" 
                  checked={features.aiMasterToggle}
                  onCheckedChange={() => toggleFeature('aiMasterToggle')}
                />
              </div>
            </div>
            <div className="space-y-4">
              {/* HSV Color Space */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <Label htmlFor="hsv-toggle" className="mb-1 text-black">
                    HSV Color Space
                  </Label>
                  <span className="text-xs text-black">
                    Use HSV for better perception
                  </span>
                </div>
                <Switch 
                  id="hsv-toggle" 
                  checked={features.useHSV}
                  onCheckedChange={() => toggleFeature('useHSV')}
                />
              </div>
              
              {/* Exposure Masking toggle removed - already handled in analysis controls */}
              
              {/* Weighted Delta-E */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col">
                  <Label htmlFor="delta-e-toggle" className="mb-1 text-black">
                    Weighted Delta-E
                  </Label>
                  <span className="text-xs text-black">
                    Prioritize perceptual differences
                  </span>
                </div>
                <Switch 
                  id="delta-e-toggle" 
                  checked={features.useWeightedDeltaE}
                  onCheckedChange={() => toggleFeature('useWeightedDeltaE')}
                />
              </div>
              
              {/* Clinical Layering */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label htmlFor="clinical-toggle" className="mb-1 text-black">
                    Clinical Layering Suggestions
                  </Label>
                  <span className="text-xs text-black">
                    Get layering recommendations
                  </span>
                </div>
                <Switch 
                  id="clinical-toggle" 
                  checked={features.useClinicalSuggestions}
                  onCheckedChange={() => toggleFeature('useClinicalSuggestions')}
                />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-[#ecedef] opacity-30 pointer-events-none z-10"></div>
        </div>
      </TabContent>
      
      <TabContent active={activeTab === 'analysis'}>
        <div className="border border-dotted border-gray-500 rounded-lg mt-4 mb-2 bg-transparent relative overflow-hidden">
          <div className="px-6 py-4 relative z-0">
            <h3 className="text-lg text-black font-manrope font-light mb-3">Detailed Analysis</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">LAB Values</h3>
                  <div className="space-y-1">
                    <p className="text-sm">L: 76.5</p>
                    <p className="text-sm">a: 1.2</p>
                    <p className="text-sm">b: 18.7</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">HSV Values</h3>
                  <div className="space-y-1">
                    <p className="text-sm">H: 42°</p>
                    <p className="text-sm">S: 74%</p>
                    <p className="text-sm">V: 87%</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="text-xs text-gray-500 mb-1">Closest VITA Shades</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-amber-50 border border-amber-100 rounded p-2 text-center">
                    <p className="font-medium">A2</p>
                    <p className="text-xs text-gray-500">ΔE: 2.3</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                    <p className="font-medium">B2</p>
                    <p className="text-xs text-gray-500">ΔE: 3.8</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                    <p className="font-medium">A1</p>
                    <p className="text-xs text-gray-500">ΔE: 4.2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-[#ecedef] opacity-30 pointer-events-none z-10"></div>
        </div>
      </TabContent>
      
      <TabContent active={activeTab === 'suggestions'}>
        <div className="border border-dotted border-gray-500 rounded-lg mt-4 mb-2 bg-transparent relative overflow-hidden">
          <div className="px-6 py-4 relative z-0">
            <h3 className="text-lg text-black font-manrope font-light mb-3">Clinical Suggestions</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <h3 className="text-black font-medium mb-2">Recommended Approach</h3>
                <p className="text-sm text-black">
                  For this A2 shade, consider a two-layer approach with a dentin core and enamel overlay.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-black mb-2">Layering Technique</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-black">
                  <li>Base: A2 Dentin (80% thickness)</li>
                  <li>Body: A1 Body (40% thickness)</li>
                  <li>Enamel: Translucent Enamel (20% thickness)</li>
                </ul>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium text-black mb-2">Alternative Options</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-black">
                  <li>Single layer with A2 HT (high translucency)</li>
                  <li>Blend A2/B2 for increased warmth</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-[#ecedef] opacity-30 pointer-events-none z-10"></div>
        </div>
      </TabContent>
    </div>
  );
};

export default AnalysisPhase;
