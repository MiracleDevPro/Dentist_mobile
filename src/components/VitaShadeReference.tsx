
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFeatures } from '@/contexts/FeaturesContext';
import { rgbToHsv, labToRgb } from '@/utils/colorConversions';

interface VitaShadeReferenceProps {
  shade: string;
  selectedPixelData: {
    lab: { L: number; a: number; b: number };
    rgb: { r: number; g: number; b: number };
    adjustedLab?: { L: number; a: number; b: number };
    deltaE: number;
    deltaHSV?: number;
    vitaLab?: { L: number; a: number; b: number };
  } | null;
  calibration?: {
    meanClickedLab: { L: number; a: number; b: number };
    officialLab: { L: number; a: number; b: number };
    shade: string;
  } | null;
}

// Vita Classical shade data with RGB approximations for display
const vitaShadeData = {
  'A1': { L: 81, a: -1, b: 9, rgb: '#F5F3F0' },
  'A2': { L: 78, a: 1, b: 14, rgb: '#F2EFE8' },
  'A3': { L: 75, a: 3, b: 18, rgb: '#EFEBE1' },
  'A4': { L: 70, a: 4, b: 20, rgb: '#E8E2D7' },
  'B1': { L: 81, a: -2, b: 7, rgb: '#F5F4F1' },
  'B2': { L: 78, a: 0, b: 12, rgb: '#F1F0EA' },
  'B3': { L: 75, a: 2, b: 16, rgb: '#EDEAE2' },
  'B4': { L: 70, a: 3, b: 18, rgb: '#E6E1D8' },
  'C1': { L: 82, a: -3, b: 6, rgb: '#F6F5F2' },
  'C2': { L: 79, a: -1, b: 10, rgb: '#F2F1EC' },
  'C3': { L: 76, a: 1, b: 14, rgb: '#EEEBE4' },
  'C4': { L: 71, a: 2, b: 16, rgb: '#E7E3DA' },
  'D2': { L: 77, a: 2, b: 13, rgb: '#F0EDEA' },
  'D3': { L: 74, a: 4, b: 17, rgb: '#EBE7E0' },
  'D4': { L: 69, a: 5, b: 19, rgb: '#E4DFD6' },
};

const VitaShadeReference: React.FC<VitaShadeReferenceProps> = ({
  shade,
  selectedPixelData,
  calibration
}) => {
  const { isFeatureEnabled } = useFeatures();
  const showHSV = isFeatureEnabled('useHSV');
  const shadeData = vitaShadeData[shade as keyof typeof vitaShadeData];
  
  if (!shadeData) return null;

  const calculateDeltaE = () => {
    if (!selectedPixelData) return null;
    
    // If we have adjusted lab values from calibration, use them
    const labToUse = selectedPixelData.adjustedLab || selectedPixelData.lab;
    
    const deltaE = Math.sqrt(
      Math.pow(labToUse.L - shadeData.L, 2) +
      Math.pow(labToUse.a - shadeData.a, 2) +
      Math.pow(labToUse.b - shadeData.b, 2)
    );
    
    return deltaE;
  };

  const deltaE = calculateDeltaE();

  return (
    <div className="space-y-4 font-manrope !text-black">
      <div>
        <h4 className="text-sm font-medium !text-black mb-3">Reference Shade: {shade}</h4>
        
        {/* Shade Swatch */}
        <div className="flex flex-row items-start gap-2 mb-3 font-manrope !text-black">
          <div
            className="w-6 h-6 rounded border bg-gray-200 border-gray-300 !text-black"
          />
          <div className="text-sm font-manrope !text-black">
            <Badge variant="outline" className="inline-flex">{shade}</Badge>
            <p className="text-xs !text-black font-manrope">Standard color</p>
          </div>
        </div>

        {/* True LAB Values */}
        <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 !text-black">
          <h5 className="text-base font-semibold !text-black font-manrope mb-2">Reference LAB Values</h5>
          <div className="grid grid-cols-3 gap-2 text-sm font-manrope !text-black">
            <div className="text-center">
              <div className="font-medium !text-black">L*</div>
              <div className="!text-black">{shadeData.L}</div>
            </div>
            <div className="text-center">
              <div className="font-medium !text-black">a*</div>
              <div className="!text-black">{shadeData.a}</div>
            </div>
            <div className="text-center">
              <div className="font-medium !text-black">b*</div>
              <div className="!text-black">{shadeData.b}</div>
            </div>
          </div>
        </div>
        
        {/* HSV Values - Only shown when HSV feature is enabled */}
        {showHSV && (
          <div className="bg-gray-100 p-3 rounded-lg mt-3 border border-gray-300 !text-black">
            <h5 className="text-base font-semibold !text-black font-manrope mb-2">Reference HSV Values</h5>
            {(() => {
              // Convert LAB to RGB to HSV
              const rgb = labToRgb({ L: shadeData.L, a: shadeData.a, b: shadeData.b });
              const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
              
              return (
                <div className="grid grid-cols-3 gap-2 text-sm font-manrope !text-black">
                  <div className="text-center">
                    <div className="font-medium !text-black">H</div>
                    <div className="!text-black">{(hsv.h * 360).toFixed(0)}°</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium !text-black">S</div>
                    <div className="!text-black">{(hsv.s * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium !text-black">V</div>
                    <div className="!text-black">{(hsv.v * 100).toFixed(0)}%</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Calibration Data Display */}
        {calibration && calibration.shade === shade && (
          <div className="bg-gray-100 p-3 rounded-lg mt-3 border border-gray-300 !text-black">
            <h5 className="text-base font-semibold !text-black font-manrope mb-2">Calibration Information</h5>
            <div className="space-y-2 text-sm font-manrope !text-black">
              <p className="text-sm font-medium !text-black font-manrope">Mean Clicked LAB Values:</p>
              <div className="grid grid-cols-3 gap-2 text-sm font-manrope !text-black">
                <div className="text-center">
                  <div className="font-medium !text-black">L*</div>
                  <div className="!text-black">{calibration.meanClickedLab.L.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium !text-black">a*</div>
                  <div className="!text-black">{calibration.meanClickedLab.a.toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium !text-black">b*</div>
                  <div className="!text-black">{calibration.meanClickedLab.b.toFixed(1)}</div>
                </div>
              </div>
              
              <p className="text-sm font-medium !text-black font-manrope mt-2">Calibration Offset:</p>
              <div className="grid grid-cols-3 gap-2 text-sm font-manrope !text-black">
                <div className="text-center">
                  <div className="font-medium !text-black">L*</div>
                  <div className="!text-black">{(calibration.officialLab.L - calibration.meanClickedLab.L).toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium !text-black">a*</div>
                  <div className="!text-black">{(calibration.officialLab.a - calibration.meanClickedLab.a).toFixed(1)}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium !text-black">b*</div>
                  <div className="!text-black">{(calibration.officialLab.b - calibration.meanClickedLab.b).toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {deltaE !== null && (
        <>
          <Separator className="my-4" />
          <div>
            <h5 className="text-sm font-medium !text-black mb-2">Difference from Reference</h5>
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 font-manrope !text-black">
              <div className="flex justify-between items-center">
                <span className="text-sm !text-black font-manrope">LAB Difference:</span>
                <div className={`px-2 py-0.5 text-xs font-bold rounded-md bg-gray-200 !text-black border border-gray-300 font-manrope`}>
                  ΔE {deltaE.toFixed(1)}
                </div>
              </div>
              <p className="text-xs !text-black mt-1 font-manrope">
                {deltaE < 1 ? "Imperceptible difference" :
                 deltaE < 2 ? "Slight difference" :
                 deltaE < 5 ? "Noticeable difference" :
                 "Significant difference"}
              </p>
              
              {/* HSV Difference - Only shown when HSV feature is enabled */}
              {showHSV && selectedPixelData && selectedPixelData.deltaHSV !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-300 !text-black">
                  <div className="flex justify-between items-center font-manrope !text-black">
                    <span className="text-sm !text-black font-manrope">HSV Difference:</span>
                    <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-gray-200 !text-black border border-gray-300 font-manrope">
                      {selectedPixelData.deltaHSV.toFixed(3)}
                    </div>
                  </div>
                  <p className="text-xs !text-black mt-1 font-manrope">
                    HSV matching considers hue, saturation and value differences
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VitaShadeReference;
