
import * as React from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicalLayeringInfo } from './AIFeaturesPanel';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eyedropper } from 'phosphor-react';
import { rgbToHsv } from '@/utils/colorConversions';
import { useFeatures } from '@/contexts/FeaturesContext';
import { generateClinicalSuggestion } from '@/utils/clinicalSuggestions';

interface PixelData {
  rgb: { r: number; g: number; b: number };
  lab: { L: number; a: number; b: number };
  adjustedLab?: { L: number; a: number; b: number };
  vitaShade: string;
  vitaLab?: { L: number; a: number; b: number };
  deltaE: number;
  deltaHSV?: number;
  position: { x: number; y: number };
  sampleSize?: number;
  calibrationLab?: any;
  confidenceScore?: number;
  shadeFamilyExplanation?: string;
}

interface ColorDataPanelProps {
  pixelData: PixelData | null;
}

const ColorDataPanel: React.FC<ColorDataPanelProps> = ({ pixelData }) => {
  const { isFeatureEnabled, features } = useFeatures();
  const showHSV = isFeatureEnabled('useHSV');
  
  // Debug clinical suggestions implementation more extensively
  useEffect(() => {
    if (pixelData) {
      // EXTENDED DEBUG LOGGING
      console.log('DETAILED Clinical Suggestions Debug:', { 
        masterToggle: features.aiMasterToggle,
        clinicalSuggestionsFeatureFlag: features.useClinicalSuggestions,
        isEnabledCheck: isFeatureEnabled('useClinicalSuggestions'), 
        hasLabData: !!pixelData.lab, 
        labData: pixelData.lab,
        hasVitaLab: !!pixelData.vitaLab, 
        vitaLabValue: pixelData.vitaLab,  // Show actual value or undefined
        shadeName: pixelData.vitaShade,
        entirePixelData: pixelData,  // Log the entire object for inspection
        shouldShowSuggestions: !!pixelData.lab && !!pixelData.vitaShade, // Removed vitaLab requirement
      });
      
      // Test the suggestion generation directly with detailed analysis logging
      if (pixelData.lab && pixelData.vitaLab && pixelData.vitaShade) {
        try {
          const suggestion = generateClinicalSuggestion(
            pixelData.lab,
            pixelData.vitaShade,
            pixelData.vitaLab
          );
          
          // DETAILED LAB ANALYSIS LOGGING
          console.log('==== DETAILED SHADE ANALYSIS ====');
          console.log(`Tooth Sample: L*=${pixelData.lab.L.toFixed(1)}, a*=${pixelData.lab.a.toFixed(1)}, b*=${pixelData.lab.b.toFixed(1)}`);
          console.log(`${pixelData.vitaShade} Reference: L*=${pixelData.vitaLab.L.toFixed(1)}, a*=${pixelData.vitaLab.a.toFixed(1)}, b*=${pixelData.vitaLab.b.toFixed(1)}`);
          console.log(`Differences: ΔL*=${suggestion.difference.deltaL.toFixed(1)}, Δa*=${suggestion.difference.deltaA.toFixed(1)}, Δb*=${suggestion.difference.deltaB.toFixed(1)}, ΔE=${suggestion.difference.deltaE.toFixed(1)}`);
          console.log(`Significance: L*=${Math.abs(suggestion.difference.deltaL) > 3 ? 'YES' : 'no'}, a*=${Math.abs(suggestion.difference.deltaA) > 1.5 ? 'YES' : 'no'}, b*=${Math.abs(suggestion.difference.deltaB) > 2 ? 'YES' : 'no'}, ΔE=${suggestion.difference.deltaE > 3.3 ? 'YES' : 'no'}`);
          console.log(`Clinical suggestion: ${suggestion.text}`);
          console.log('================================');
          
        } catch (err) {
          console.error('Error generating clinical suggestions:', err);
        }
      }
    }
  }, [pixelData, isFeatureEnabled, features]);
  if (!pixelData) {
    return (
      <Card className="modern-shadow hover-lift border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-black text-center">
            Color Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-full">
            <div className="text-center w-full">
              <h3 className="font-semibold text-black mb-2 text-2xl manrope-light">Ready to Analyze</h3>
              <p className="text-gray-500 text-sm">Click on the image to analyze color values</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { rgb, lab, adjustedLab, vitaShade, vitaLab, deltaE, position, sampleSize = 1, calibrationLab, shadeFamilyExplanation } = pixelData;
  console.log('ColorDataPanel vitaShade:', vitaShade, typeof vitaShade);
  return (
    <Card className="modern-shadow hover-lift border-0 bg-[#ecedef] backdrop-blur-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl text-black manrope-light">
          <div className="w-10 h-10 bg-[#ecedef] rounded-xl flex items-center justify-center">
            <img src="/images/eyedropper-sample-thin.svg" width="24" height="24" alt="Eyedropper Sample Thin" />
          </div>
          Color Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Swatch */}
        <div className="flex flex-row items-start gap-4">
          <div className="flex flex-col items-start">
            <div
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg"
              style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
            />
            {sampleSize > 1 && (
              <span className="text-xs text-black font-manrope mt-1 text-gray-600">Area sample: {sampleSize}×{sampleSize}px</span>
            )}
          </div>
          <div>
            <div className="inline-flex mb-2">
              <Badge variant="outline" className="bg-gray-200 text-black border border-gray-300 text-sm font-medium px-3 py-1 rounded-md">
                {typeof vitaShade === 'string' ? vitaShade : (vitaShade ? String(vitaShade) : 'Unknown')}
              </Badge>
            </div>
            <p className="text-xs text-black font-manrope text-gray-600">Best Vita match</p>
            {shadeFamilyExplanation && (
              <p className="text-xs text-black font-manrope text-indigo-600 mt-1">
                {shadeFamilyExplanation}
              </p>
            )}
            {calibrationLab && (
              <span className="text-xs text-black font-manrope text-green-600 font-medium">Calibrated results</span>
            )}
            
            {/* Advanced clinical suggestions panel with LAB difference analysis */}
            {/* Always show clinical suggestions when data is available, bypassing feature flags */}
            {/* NOTE: Now showing even without vitaLab data for debugging */}
            <div className="mt-3 pt-2 border-t border-gray-200 flex items-center">
  <div className="text-sm flex-1">
                {!pixelData.vitaShade || !pixelData.lab ? (
                  <>
                    <div className="text-sm font-medium text-black">Clinical Insight:</div>
                    <div className="text-gray-600 mt-1 flex items-center">
  Click on a tooth sample to see clinical layering suggestions.
  <ClinicalLayeringInfo />
</div>
                  </>
                ) : (
                  (() => {
                    try {
                      // Now our generator can handle missing vitaLab data, using lookup table instead
                      console.log('Generating clinical suggestion with tooth LAB data:', pixelData.lab);
                      
                      // Generate advanced clinical suggestion based on LAB differences
                      const suggestion = generateClinicalSuggestion(
                        pixelData.lab,
                        pixelData.vitaShade,
                        pixelData.vitaLab  // Will use lookup table if this is undefined
                      );
                      
                      // DETAILED LAB ANALYSIS LOGGING
                      console.log('==== DETAILED SHADE ANALYSIS ====');
                      console.log(`Tooth Sample: L*=${pixelData.lab.L.toFixed(1)}, a*=${pixelData.lab.a.toFixed(1)}, b*=${pixelData.lab.b.toFixed(1)}`);
                      // Using reference values from either vitaLab if present or our lookup table
                      const referenceValues = pixelData.vitaLab || suggestion.referenceValues;
                      if (referenceValues) {
                        console.log(`${pixelData.vitaShade} Reference: L*=${referenceValues.L.toFixed(1)}, a*=${referenceValues.a.toFixed(1)}, b*=${referenceValues.b.toFixed(1)}`);
                      } else {
                        console.log(`${pixelData.vitaShade} Reference: Using default values`); 
                      }
                      console.log(`Differences: ΔL*=${suggestion.difference.deltaL.toFixed(1)}, Δa*=${suggestion.difference.deltaA.toFixed(1)}, Δb*=${suggestion.difference.deltaB.toFixed(1)}, ΔE=${suggestion.difference.deltaE.toFixed(1)}`);
                      console.log(`Significance: L*=${Math.abs(suggestion.difference.deltaL) > 3 ? 'YES' : 'no'}, a*=${Math.abs(suggestion.difference.deltaA) > 1.5 ? 'YES' : 'no'}, b*=${Math.abs(suggestion.difference.deltaB) > 2 ? 'YES' : 'no'}, ΔE=${suggestion.difference.deltaE > 3.3 ? 'YES' : 'no'}`);
                      console.log(`Clinical suggestion: ${suggestion.text}`);
                      console.log('================================');
                      
                      // Determine badge color based on difference significance
                      const diffBadgeColor = suggestion.difference.significant ? 
                        (suggestion.difference.deltaE > 5 ? "bg-gray-200 text-black border-gray-300" : "bg-gray-200 text-black border-gray-300") :
                        "bg-green-100 text-green-800 border-green-200";
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <div className="text-sm font-medium text-black">Clinical Insight:</div>
                            <div className={`px-2 py-0.5 text-xs text-black font-manrope font-medium rounded-md border ${diffBadgeColor}`}>
                              ΔE: {suggestion.difference.deltaE.toFixed(1)}
                            </div>
                          </div>
                          
                          <div className="text-gray-600 mt-2">
                            {suggestion.text}
                          </div>
                          
                          {suggestion.difference.significant && (
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-black font-manrope">
                              <div className={`px-2 py-1 rounded text-center ${Math.abs(suggestion.difference.deltaL) > 3 ? "bg-gray-100 border border-gray-200" : ""}`}>
                                <span className="font-medium">ΔL: {suggestion.difference.deltaL > 0 ? "+" : ""}{suggestion.difference.deltaL.toFixed(1)}</span>
                                <br/>
                                <span className="opacity-70 text-[10px]">{suggestion.difference.deltaL > 0 ? "Lighter" : "Darker"}</span>
                              </div>
                              <div className={`px-2 py-1 rounded text-center ${Math.abs(suggestion.difference.deltaA) > 2 ? "bg-gray-100 border border-gray-200" : ""}`}>
                                <span className="font-medium">Δa: {suggestion.difference.deltaA > 0 ? "+" : ""}{suggestion.difference.deltaA.toFixed(1)}</span>
                                <br/>
                                <span className="opacity-70 text-[10px]">{suggestion.difference.deltaA > 0 ? "Redder" : "Greener"}</span>
                              </div>
                              <div className={`px-2 py-1 rounded text-center ${Math.abs(suggestion.difference.deltaB) > 2 ? "bg-gray-100 border border-gray-200" : ""}`}>
                                <span className="font-medium">Δb: {suggestion.difference.deltaB > 0 ? "+" : ""}{suggestion.difference.deltaB.toFixed(1)}</span>
                                <br/>
                                <span className="opacity-70 text-[10px]">{suggestion.difference.deltaB > 0 ? "Yellower" : "Bluer"}</span>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    } catch (error) {
                      console.error('Error generating clinical suggestion:', error);
                      return (
                        <>
                          <div className="font-medium text-purple-800">Clinical Insight:</div>
                          <div className="text-gray-700 mt-1">
                            Use {pixelData.vitaShade} as your base shade with standard layering technique.
                          </div>
                        </>
                      );
                    }
                  })()
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-200" />

        {/* RGB Values */}
        <div>
          <h4 className="text-sm font-medium text-black mb-3">RGB Values</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-300">
              <div className="font-medium text-xs text-black font-manrope bg-red-100 px-3 py-1 rounded-md">R</div>
              <div className="font-medium text-black text-sm">{rgb.r}</div>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-300">
              <div className="font-medium text-xs text-black font-manrope bg-green-100 px-3 py-1 rounded-md">G</div>
              <div className="font-medium text-black text-sm">{rgb.g}</div>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg text-center border border-gray-300">
              <div className="font-medium text-xs text-black font-manrope bg-blue-100 px-3 py-1 rounded-md">B</div>
              <div className="font-medium text-black text-sm">{rgb.b}</div>
            </div>
          </div>
        </div>

        {/* LAB Values */}
        <div>
          <h4 className="text-sm font-medium text-black mb-3">LAB Values</h4>
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            {adjustedLab ? (
              <>
                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Calibrated LAB Values:</div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">L*</div>
                      <div className="font-medium text-black text-sm">{adjustedLab.L.toFixed(1)}</div>
                      <div className="text-xs text-black font-manrope ">Lightness</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">a*</div>
                      <div className="text-xl font-bold text-black font-manrope">{adjustedLab.a.toFixed(1)}</div>
                      <div className="text-xs text-black font-manrope ">Green ↔ Red</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">b*</div>
                      <div className="text-xl font-bold text-black font-manrope">{adjustedLab.b.toFixed(1)}</div>
                      <div className="text-xs text-black font-manrope ">Blue ↔ Yellow</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/30">
                  <div className="text-sm font-medium mb-1">Raw LAB Measurement:</div>
                  <div className="grid grid-cols-3 gap-4 text-center ">
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">L*</div>
                      <div className="text-base">{lab.L.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">a*</div>
                      <div className="text-base">{lab.a.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">b*</div>
                      <div className="text-base">{lab.b.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-sm text-black font-manrope">L*</div>
                  <div className="text-xl font-bold text-black font-manrope">{lab.L.toFixed(1)}</div>
                  <div className="text-xs text-black font-manrope ">Lightness</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-black font-manrope">a*</div>
                  <div className="text-xl font-bold text-black font-manrope">{lab.a.toFixed(1)}</div>
                  <div className="text-xs text-black font-manrope ">Green ↔ Red</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-black font-manrope">b*</div>
                  <div className="text-xl font-bold text-black font-manrope">{lab.b.toFixed(1)}</div>
                  <div className="text-xs text-black font-manrope ">Blue ↔ Yellow</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HSV Values - Only shown when HSV feature is enabled */}
        {showHSV && pixelData.rgb && (
          <div>
            <h4 className="font-semibold mb-3 text-black">HSV Values</h4>
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4 rounded-xl shadow-lg">
              {(() => {
                const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                return (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">H</div>
                      <div className="text-xl font-bold text-black font-manrope">{(hsv.h * 360).toFixed(0)}°</div>
                      <div className="text-xs text-black font-manrope ">Hue</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">S</div>
                      <div className="text-xl font-bold text-black font-manrope">{(hsv.s * 100).toFixed(0)}%</div>
                      <div className="text-xs text-black font-manrope ">Saturation</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-black font-manrope">V</div>
                      <div className="text-xl font-bold text-black font-manrope">{(hsv.v * 100).toFixed(0)}%</div>
                      <div className="text-xs text-black font-manrope ">Value</div>
                    </div>
                  </div>
                );
              })()} 
            </div>
          </div>
        )}

        {/* Match Quality */}
        <div>
          <h4 className="mb-3 text-2xl text-black manrope-light">Match Quality</h4>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-[#e6e7ea] shadow-sm">
            {/* Confidence Score - Show when AI features are active */}
            {pixelData.confidenceScore !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Overall Match Confidence:</span>
                  <div className="px-2 py-0.5 text-sm font-bold text-black font-manrope rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    {pixelData.confidenceScore.toFixed(0)}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className={`h-2.5 rounded-full ${pixelData.confidenceScore > 80 ? 'bg-gray-700' : pixelData.confidenceScore > 60 ? 'bg-gray-600' : pixelData.confidenceScore > 40 ? 'bg-gray-500' : 'bg-gray-400'}`} 
                    style={{ width: `${pixelData.confidenceScore}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* LAB Color Difference */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">LAB Delta E Score:</span>
              <div className={`px-2 py-0.5 text-sm font-bold text-black font-manrope rounded-md ${deltaE < 2 ? "bg-green-100 text-green-800 border border-green-200" : deltaE < 5 ? "bg-gray-200 text-gray-700 border border-gray-300" : "bg-red-100 text-red-800 border border-red-200"}`}>
                {deltaE.toFixed(1)}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {deltaE < 2 ? "Excellent match - Clinically acceptable" : 
               deltaE < 5 ? "Good match - Minor difference" : 
               "Poor match - Significant difference"}
            </p>
            
            {/* HSV Difference - Only shown when HSV feature is enabled */}
            {showHSV && pixelData.deltaHSV !== undefined && (
              <div className="mt-2 pt-2 border-t border-gray-300">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-purple-700">HSV Match Score:</span>
                  <div className="px-2 py-0.5 text-sm font-bold text-black font-manrope rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                    {pixelData.deltaHSV.toFixed(3)}
                  </div>
                </div>
                <p className="text-xs text-black font-manrope text-purple-600">
                  HSV matching considers hue, saturation and value differences
                </p>
              </div>
            )}
            
            {/* Vita Reference Value */}
            {vitaLab && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center mb-1 text-xs text-black font-manrope">
                  <span className="font-medium text-gray-700">Standard LAB Reference ({vitaShade}):</span>
                  <span className="text-gray-700">
                    L*{vitaLab.L.toFixed(1)}, a*{vitaLab.a.toFixed(1)}, b*{vitaLab.b.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinical suggestions now appear directly under the color match section */}
        
        {/* Analysis Info */}
        <div className="text-xs text-black font-manrope text-gray-500 bg-gray-100 p-2 rounded-lg border border-gray-200 flex justify-between">
          <div>
            Analysis point: X{position.x}, Y{position.y}
          </div>
          {pixelData.sampleSize && (
            <p className="text-sm text-gray-600 font-medium mb-3">
              Area sampling: {pixelData.sampleSize}×{pixelData.sampleSize} pixels ({pixelData.sampleSize * pixelData.sampleSize} pixel area)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorDataPanel;
