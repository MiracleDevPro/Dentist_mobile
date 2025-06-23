
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Save, RotateCcw, Eye, Link, Sparkles } from 'lucide-react';
import { useFeatures } from '@/contexts/FeaturesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppHeader from '@/components/AppHeader';
import UploadImage from '@/components/UploadImage';
import ColorAnalysisCanvas from '@/components/ColorAnalysisCanvas';
import VitaShadeReference from '@/components/VitaShadeReference';
import ColorDataPanel from '@/components/ColorDataPanel';
import AIFeaturesPanel from '@/components/AIFeaturesPanel';

import { saveCaseLocally, ToothCase } from "@/utils/localCaseUtils";
import { loadVitaShades } from "@/utils/shadeMatcher";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const { features, isFeatureEnabled } = useFeatures();
  const navigate = useNavigate();
  
  // Check if user is on a mobile device and redirect to mobile workflow
  useEffect(() => {
    const checkAndRedirectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone|opera mini|silk/i.test(userAgent);
      const isNarrowScreen = window.innerWidth < 768;
      
      // Only auto-redirect on actual mobile devices, not just narrow browser windows
      if (isMobile) {
        navigate('/mobile');
      }
    };
    
    // Small delay to avoid immediate redirect
    const timer = setTimeout(() => {
      checkAndRedirectMobile();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedPixelData, setSelectedPixelData] = useState<any>(null);
  const [referenceShade, setReferenceShade] = useState('');
  const [caseName, setCaseName] = useState('');
  const [saveToLocal, setSaveToLocal] = useState(false);
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

  const handleImageUpload = (imageUrls: string[]) => {
    setUploadedImages(imageUrls);
    if (imageUrls.length > 0) {
      setSelectedImage(imageUrls[0]);
    }
  };

  const handlePixelSelect = (pixelData: any) => {
    setSelectedPixelData(pixelData);
  };

  const handleReset = () => {
    setUploadedImages([]);
    setSelectedImage(null);
    setSelectedPixelData(null);
    setReferenceShade('');
    setCaseName('');
  };

  return (
    <div className="min-h-screen bg-[#ecedef]">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Image Upload Section */}
        <Card className="modern-shadow-lg hover-lift border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-400">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800 manrope-light">
              <img src="/images/upload-arrow.svg" alt="Upload icon" className="w-7 h-7" />
              Image Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadImage
              images={uploadedImages}
              onImagesChange={handleImageUpload}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
            />
            <div className="mt-4 flex flex-col gap-2 items-start">
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
              {calibrationMode && selectedImage && (
                <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side - Calibration Canvas */}
                  <Card className="w-full bg-gray-100 border border-gray-300">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between font-manrope text-gray-900">
                      <CardTitle className="text-sm font-semibold font-manrope text-gray-900">Calibration Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative" style={{ maxWidth: "100%", margin: '0 auto' }}>
                          <ColorAnalysisCanvas
                            imageUrl={selectedImage}
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
                                img.src = selectedImage;
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
                  
                  {/* Right side - Instructions and Controls */}
                  <div className="flex flex-col justify-start font-manrope text-gray-900">
                    <h3 className="text-lg font-semibold mb-2 font-manrope text-gray-900">Calibrating: Click 3-5 points on Vita Shade</h3>
                    <div className="mb-4">
                      <div className="flex gap-2 items-center mb-3">
                        <span className="text-sm font-manrope text-gray-900">Select Vita shade in image:</span>
                        <select
                          className="border rounded px-2 py-1 bg-gray-100 text-gray-900 border-gray-300 focus:bg-gray-200 focus:border-gray-400 font-manrope"
                          value={calibrationShade}
                          onChange={e => setCalibrationShade(e.target.value)}
                        >
                          <option value="">--Select--</option>
                          {['A1','A2','A3','A3.5','A4','B1','B2','B3','B4','C1','C2','C3','C4','D2','D3','D4'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <span className="text-xs ml-2 font-manrope text-gray-900">Clicks: {calibrationPoints.length}/5</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCalibrationPoints([]);
                          setCalibrationClickPositions([]);
                          setCalibration(null);
                        }}
                        className="mb-3 bg-gray-200 text-gray-900 border border-gray-300"
                      >Restart Calibration</Button>
                      {calibrationPoints.length < 3 && (
                        <span className="text-xs mt-2 block font-manrope text-gray-900">Click at least 3 different areas of the Vita shade in the image to calibrate.</span>
                      )}
                       {calibrationPoints.length >= 3 && calibrationPoints.length <= 5 && (
                        <div className="mt-2">
                          <span className="text-xs block mb-2 font-manrope text-gray-900">You may click up to 5 points. Click 'Finish Calibration' when ready.</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-200 text-gray-900 border border-gray-300 mb-2"
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
                        <span className="text-xs text-red-700 mt-2 block">Maximum 5 calibration points allowed.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas + Color Picker Panel */}
          <div className="lg:col-span-2">
            <Card className="modern-shadow-lg hover-lift border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-400">
              <CardHeader className="pb-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-2xl text-gray-800 manrope-light">
                     {selectedImage && (
                      <img src="/images/palette.svg" width="24" height="24" alt="Color palette" className="text-gray-800" />
                     )}
                    Color Analysis Canvas
                  </CardTitle>
                  {(features.useHSV || features.useWeightedDeltaE) && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <div className="flex gap-1.5">
                        {features.useHSV && (
                          <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-200 text-purple-800 border border-purple-200">
                            HSV
                          </div>
                        )}
                        {features.useWeightedDeltaE && (
                          <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-200 text-gray-800 border border-gray-400">
                            Weighted ΔE
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-slate-600 text-sm">Click on the tooth to analyze color values and get shade recommendations</p>
              </CardHeader>
              <CardContent>

                {/* Main Analysis Canvas */}
                {selectedImage ? (
                  <div className="relative w-full flex justify-center">
                    <button
                      className="absolute top-2 right-2 z-10 bg-[#ecedef] hover:bg-gray-300 hover:text-white text-red-500 rounded-full p-1 shadow-md transition-colors"
                      title="Remove image"
                      onClick={() => {
                        setSelectedImage(null);
                        setCalibration(null);
                        setCalibrationPoints([]);
                        setCalibrationClickPositions([]);
                        setSelectedPixelData(null);
                      }}
                      style={{width: 32, height: 32, fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    >
                      ×
                    </button>
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
                
                {/* AI Features Panel */}
                {selectedImage && (
                  <div className="mt-6">
                    <AIFeaturesPanel />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Color Data Panel */}
            <ColorDataPanel pixelData={selectedPixelData} />

            {/* Reference Shade Panel */}
            <Card className="modern-shadow hover-lift border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-400">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 manrope-light">Reference Shade</CardTitle>
                <p className="text-sm text-slate-600 manrope-extralight">Compare with known shade references</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reference-shade" className="text-sm font-medium text-slate-700">Known Reference Shade</Label>
                  <Select value={referenceShade} onValueChange={setReferenceShade}>
                    <SelectTrigger className="mt-2 border-gray-400 rounded-xl bg-[#ecedef] text-black">
                      <SelectValue placeholder="Select reference shade" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#ecedef] border border-gray-400 shadow-lg z-50">
                      <SelectItem value="A1" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">A1</SelectItem>
                      <SelectItem value="A2" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">A2</SelectItem>
                      <SelectItem value="A3" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">A3</SelectItem>
                      <SelectItem value="A4" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">A4</SelectItem>
                      <SelectItem value="B1" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">B1</SelectItem>
                      <SelectItem value="B2" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">B2</SelectItem>
                      <SelectItem value="B3" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">B3</SelectItem>
                      <SelectItem value="B4" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">B4</SelectItem>
                      <SelectItem value="C1" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">C1</SelectItem>
                      <SelectItem value="C2" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">C2</SelectItem>
                      <SelectItem value="C3" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">C3</SelectItem>
                      <SelectItem value="C4" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">C4</SelectItem>
                      <SelectItem value="D2" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">D2</SelectItem>
                      <SelectItem value="D3" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">D3</SelectItem>
                      <SelectItem value="D4" className="text-black hover:bg-[#e5e7ea] focus:bg-[#e5e7ea]">D4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {referenceShade && (
                  <VitaShadeReference 
                    shade={referenceShade}
                    selectedPixelData={selectedPixelData}
                    calibration={calibration}
                  />
                )}
              </CardContent>
            </Card>

            {/* Case Summary Panel */}
            <Card className="modern-shadow hover-lift border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-400">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-800 manrope-light">Case Summary</CardTitle>
                <p className="text-sm text-slate-600 manrope-extralight">Document your analysis results</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="case-name" className="text-sm font-medium text-slate-700">Case Name / Patient ID</Label>
                  <Input
                    id="case-name"
                    value={caseName}
                    onChange={(e) => setCaseName(e.target.value)}
                    placeholder="Enter case identifier"
                    className="mt-2 border-gray-400 rounded-xl bg-[#ecedef]"
                  />
                </div>
                {selectedPixelData && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Shade Match Summary</h3>
                    <div className="p-4 bg-[#ecedef] rounded-xl border border-gray-400">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 manrope-extralight">Closest Vita match:</span>
                        <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200 border border-gray-400">
                          {typeof selectedPixelData.vitaShade === 'object' ? (selectedPixelData.vitaShade?.name || JSON.stringify(selectedPixelData.vitaShade)) : selectedPixelData.vitaShade}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">
                        <div>Pixel LAB: L*{selectedPixelData.lab?.L?.toFixed(1)}, a*{selectedPixelData.lab?.a?.toFixed(1)}, b*{selectedPixelData.lab?.b?.toFixed(1)}</div>
                        {selectedPixelData.adjustedLab && (
                          <div>Adjusted LAB: L*{selectedPixelData.adjustedLab.L.toFixed(1)}, a*{selectedPixelData.adjustedLab.a.toFixed(1)}, b*{selectedPixelData.adjustedLab.b.toFixed(1)}</div>
                        )}
                        <div>Vita LAB: {selectedPixelData.vitaLab ? `L*${selectedPixelData.vitaLab.L?.toFixed(1)}, a*${selectedPixelData.vitaLab.a?.toFixed(1)}, b*${selectedPixelData.vitaLab.b?.toFixed(1)}` : 'N/A'}</div>
                        <div>ΔE: {selectedPixelData.deltaE?.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button className="w-full bg-[#e5e7ea] hover:bg-gray-300 text-gray-800 rounded-xl py-3 shadow-lg" disabled>
                    <Link className="w-4 h-4 mr-2" />
                    Copy The Link
                  </Button>
                  
                  <Button className="w-full bg-[#e5e7ea] hover:bg-gray-300 text-gray-800 rounded-xl py-3 shadow-lg" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export as PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <Card className="modern-shadow border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-400">
          <CardContent className="py-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="rounded-xl border-gray-400 hover:bg-[#e5e7ea] bg-[#ecedef] text-black manrope-light"
                >
                  <RotateCcw className="w-4 h-4 mr-2 text-black" />
                  Reset Analysis
                </Button>
                <Button 
                  disabled={!selectedPixelData}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg"
                  onClick={() => {
                    if (!selectedPixelData || !saveToLocal) return;
                    const newCase: ToothCase = {
                      id: crypto.randomUUID(),
                      caseName,
                      imageUrl: selectedImage || '',
                      toothLab: selectedPixelData.lab,
                      matchedShade: {
                        name: selectedPixelData.vitaShade,
                        lab: selectedPixelData.vitaLab
                      },
                      referenceShade,
                      deltaE: selectedPixelData.deltaE || 0,
                      createdAt: new Date().toISOString()
                    };
                    saveCaseLocally(newCase);
                    toast({ title: "Case saved locally!", description: `Case '${caseName}' has been saved.` });
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
