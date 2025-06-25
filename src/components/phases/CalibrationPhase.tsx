import React, { useState } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ColorAnalysisCanvas from '@/components/ColorAnalysisCanvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { saveCaseLocally, ToothCase } from "@/utils/localCaseUtils";
import { loadVitaShades } from "@/utils/shadeMatcher";
import { toast } from "@/components/ui/use-toast";

const CalibrationPhase: React.FC = () => {
  const { state, updateCalibrationData, goToNextPhase, goToPreviousPhase } = useWorkflow();
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);
  const [circleSize, setCircleSize] = useState(20);
  const [exposureMask, setExposureMask] = useState({
    enabled: true,
    value: 0,
  });
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [calibrationStarted, setCalibrationStarted] = useState(false);

  // For demonstration, you may want to track clicks and selected shade
  const [clickCount, setClickCount] = useState(0);
  const [selectedShade, setSelectedShade] = useState('');
  const [referenceShade, setReferenceShade] = useState('');
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
  const [calibrationPoints, setCalibrationPoints] = useState<{ 
    L: number; a: number; b: number; 
    hsv?: { h: number; s: number; v: number } 
  }[]>([]);
  const [calibrationClickPositions, setCalibrationClickPositions] = useState<{ x: number; y: number }[]>([]);
  const uploadedImageUrl = state.uploadedImage ? URL.createObjectURL(state.uploadedImage) : null;

  const handleCalibrate = () => {
    if (!calibrationStarted) {
      setCalibrationStarted(true);
      return;
    }
    updateCalibrationData({
      isCompleted: true,
      circles: [
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

  // Mobile layout
  return (
    <div className="w-full min-h-screen px-2 py-4" style={{ background: '#ECEDEF' }}>
      <div className="mt-4 flex flex-col gap-2 items-start mb-4">
          <div className="flex gap-4 items-center">
            <Button
                  variant={calibrationMode ? "secondary" : "outline"}
                  onClick={() => {
                    setCalibrationMode(!calibrationMode);
                    setCalibrationPoints([]);
                    setCalibrationClickPositions([]);
                    setCalibrationShade("");
                    setCalibration(null);
                  }}
                  className={calibrationMode ? "bg-gray-200 text-gray-800 border border-gray-300" : "bg-gray-100 hover:bg-gray-300 text-gray-800 border border-gray-300 manrope-light"}
                >
                  {calibrationMode ? "Cancel Calibration" : "Start Calibration"}
                </Button>
                {calibration && (
                  <span className="text-sm text-slate-700">
                    Calibration: Mean Clicked LAB L*{calibration.meanClickedLab.L.toFixed(1)}, a*{calibration.meanClickedLab.a.toFixed(1)}, b*{calibration.meanClickedLab.b.toFixed(1)} → Official Vita {calibration.shade} LAB L*{calibration.officialLab.L.toFixed(1)}, a*{calibration.officialLab.a.toFixed(1)}, b*{calibration.officialLab.b.toFixed(1)}
                  </span>
                )}    
          </div>    
              
          {/* Calibration Section with side-by-side layout */}
            {calibrationMode && (
              <div className="mt-4 w-full flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
                {/* Calibration Canvas Card */}
                <Card className="w-full bg-gray-100 border border-gray-300 mb-4 md:mb-0">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between font-manrope text-gray-900">
                    <CardTitle className="text-sm font-semibold font-manrope text-gray-900">Calibration Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="relative w-full max-w-xs mx-auto">
                        <ColorAnalysisCanvas
                          imageUrl={uploadedImageUrl}
                          onPixelSelect={() => {}}
                          onCalibrationClick={async (x, y) => {
                            if (calibrationPoints.length < 5) {
                              setCalibrationClickPositions(prev => [...prev, { x, y }]);
                              // Sample LAB at (x, y) from the image
                              const img = new window.Image();
                              img.crossOrigin = 'anonymous';
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0);
                                  const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
                                  const r = pixel[0], g = pixel[1], b = pixel[2];
                                  // Use the same rgbToLab as in ColorAnalysisCanvas
                                  const rgbToLab = (r: number, g: number, b: number) => {
                                    r = r / 255;
                                    g = g / 255;
                                    b = b / 255;
                                    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
                                    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
                                    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
                                    r = r * 100;
                                    g = g * 100;
                                    b = b * 100;
                                    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
                                    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
                                    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
                                    const xRef = 95.047, yRef = 100.0, zRef = 108.883;
                                    const xNorm = x / xRef, yNorm = y / yRef, zNorm = z / zRef;
                                    const fx = xNorm > 0.008856 ? Math.pow(xNorm, 1/3) : (7.787 * xNorm) + (16/116);
                                    const fy = yNorm > 0.008856 ? Math.pow(yNorm, 1/3) : (7.787 * yNorm) + (16/116);
                                    const fz = zNorm > 0.008856 ? Math.pow(zNorm, 1/3) : (7.787 * zNorm) + (16/116);
                                    const L = (116 * fy) - 16;
                                    const a = 500 * (fx - fy);
                                    const bb = 200 * (fy - fz);
                                    return { L, a, b: bb };
                                  };
                                  // Calculate LAB values
                                  const lab = rgbToLab(r, g, b);
                                  
                                  // Calculate HSV values
                                  const rgbToHsv = (r: number, g: number, b: number) => {
                                    // Normalize RGB values to 0-1 range
                                    r /= 255;
                                    g /= 255;
                                    b /= 255;
                                    
                                    const max = Math.max(r, g, b);
                                    const min = Math.min(r, g, b);
                                    let h = 0;
                                    let s = 0;
                                    const v = max;
                                    
                                    const d = max - min;
                                    s = max === 0 ? 0 : d / max;
                                    
                                    if (max === min) {
                                      h = 0; // achromatic
                                    } else {
                                      switch (max) {
                                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                                        case g: h = (b - r) / d + 2; break;
                                        case b: h = (r - g) / d + 4; break;
                                      }
                                      h /= 6;
                                    }
                                    
                                    return { h, s, v };
                                  };

                                  const hsv = rgbToHsv(r, g, b);
                                  
                                  // Store both LAB and HSV values in the calibration point
                                  setCalibrationPoints(prev => [...prev, { ...lab, hsv }]);
                                  
                                }
                              };
                              img.src = uploadedImageUrl;
                            }
                          }}
                          calibrationPoints={calibrationPoints}
                          calibrationClickPositions={calibrationClickPositions}
                          calibrationMode={calibrationMode}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Controls Card */}
                <Card className="w-full bg-gray-100 border border-gray-300">
                  <CardContent>
                    <div className="flex flex-col justify-start font-manrope text-gray-900 w-full mt-4">
                      <h3 className="text-base font-semibold mb-2 font-manrope text-gray-900 text-center md:text-left">
                        Calibrating: Click 3-5 points on Vita Shade
                      </h3>
                      <div className="mb-4 flex flex-col gap-2">
                        <div className="flex flex-col gap-2 mb-3">
                          <span className="text-sm font-manrope text-gray-900">Select Vita shade in image:</span>
                          <select
                            className="border rounded px-3 py-2 bg-gray-100 text-gray-900 border-gray-600 focus:bg-gray-100 focus:border-gray-600 font-manrope w-full"
                            value={calibrationShade}
                            onChange={e => setCalibrationShade(e.target.value)}
                          >
                            <option value="">--Select--</option>
                            {['A1','A2','A3','A3.5','A4','B1','B2','B3','B4','C1','C2','C3','C4','D2','D3','D4'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="text-xs font-manrope text-gray-900">Clicks: {calibrationPoints.length}/5</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCalibrationPoints([]);
                            setCalibrationClickPositions([]);
                            setCalibration(null);
                          }}
                          className="mb-2 bg-gray-200 text-gray-900 border border-gray-300 w-full"
                        >Restart Calibration</Button>
                        {calibrationPoints.length < 3 && (
                          <span className="text-xs mt-2 block font-manrope text-gray-900 text-center">
                            Click at least 3 different areas of the Vita shade in the image to calibrate.
                          </span>
                        )}
                        {calibrationPoints.length >= 3 && calibrationPoints.length <= 5 && (
                          <div className="mt-2 flex flex-col gap-2">
                            <span className="text-xs block mb-2 font-manrope text-gray-900 text-center">
                              You may click up to 5 points. Click 'Finish Calibration' when ready.
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-gray-200 text-gray-900 border border-gray-300 mb-2 w-full"
                              disabled={!calibrationShade}
                              title={!calibrationShade ? 'Select a Vita shade to enable calibration' : ''}
                              onClick={async () => {
                                if (!calibrationShade) return;
                                // Compute mean LAB
                                const points = calibrationPoints;
                                const meanLab = {
                                  L: points.reduce((sum, p) => sum + p.L, 0) / points.length,
                                  a: points.reduce((sum, p) => sum + p.a, 0) / points.length,
                                  b: points.reduce((sum, p) => sum + p.b, 0) / points.length,
                                };
                                
                                // Compute mean HSV if HSV values are available in the calibration points
                                let meanHsv = undefined;
                                if (points.every(p => p.hsv)) {
                                  meanHsv = {
                                    h: points.reduce((sum, p) => sum + (p.hsv?.h || 0), 0) / points.length,
                                    s: points.reduce((sum, p) => sum + (p.hsv?.s || 0), 0) / points.length,
                                    v: points.reduce((sum, p) => sum + (p.hsv?.v || 0), 0) / points.length,
                                  };
                                }
                                
                                // Fetch official LAB and HSV for selected shade
                                try {
                                  const shades = await loadVitaShades();
                                  const official = shades.find(s => s.name === calibrationShade);
                                  if (official) {
                                    setCalibration({
                                      meanClickedLab: meanLab, 
                                      officialLab: official.lab,
                                      // Include HSV values if available
                                      meanClickedHsv: meanHsv,
                                      officialHsv: official.hsv,
                                      shade: calibrationShade 
                                    });
                                    // Auto-set the reference shade to match the calibration shade
                                    setReferenceShade(calibrationShade);
                                    // Calibration complete notification removed as per user request.
                                  } else {
                                    toast({
                                      title: "Calibration Error",
                                      description: `Could not find shade ${calibrationShade} in database`,
                                      variant: "destructive",
                                      duration: 3000
                                    });
                                  }
                                  setCalibrationMode(false);
                                  setCalibrationShade("");
                                  setCalibrationPoints([]);
                                  setCalibrationClickPositions([]);
                                } catch (error) {
                                  console.error("Error during calibration:", error);
                                  toast({
                                    title: "Calibration Failed",
                                    description: "Could not load shade data. Please try again.",
                                    variant: "destructive",
                                    duration: 3000
                                  });
                                }
                              }}
                            >
                              {calibrationShade ? 'Finish Calibration' : 'Select Shade First'}
                            </Button>
                          </div>
                        )}
                        {calibrationPoints.length > 5 && (
                          <span className="text-xs text-red-700 mt-2 block text-center">
                            Maximum 5 calibration points allowed.
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          )}    
      </div>

      {/* Calibration Circle Size */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Calibration Circle Size</h4>
          <span className="text-xs text-gray-600">{circleSize}px</span>
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

      {/* Exposure Masking Controls */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="exposure-threshold" className="text-sm">Exposure Mask</Label>
          <span className="text-xs text-gray-600">{exposureMask.value}%</span>
        </div>
        <Slider
          id="exposure-threshold"
          value={[exposureMask.value]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => setExposureMask(prev => ({ ...prev, value: value[0] }))}
        />
      </div>

      {/* Skip Dialog */}
      <Dialog open={isSkipDialogOpen} onOpenChange={setIsSkipDialogOpen}>
        <DialogContent className="bg-[#ECEDEF] border-0">
          <DialogHeader>
            <DialogTitle className="text-black font-manrope font-extralight">Cancel Calibration?</DialogTitle>
            <DialogDescription className="text-black font-manrope font-extralight">
              Cancelling calibration may reduce the accuracy of color analysis.
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

      {/* Prev/Next buttons at the bottom */}
      <div className="fixed left-0 w-full px-2 pb-4 bg-[#ECEDEF]">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex gap-2">
            <button
              onClick={goToPreviousPhase}
              className="flex-1 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-manrope font-medium border border-gray-300"
            >
              Prev
            </button>
            <button
              onClick={goToNextPhase}
              className="flex-1 px-4 py-2 rounded-md bg-gray-900 hover:bg-gray-800 text-white font-manrope font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationPhase;
