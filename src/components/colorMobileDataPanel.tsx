import * as React from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicalLayeringInfo } from "./AIFeaturesPanel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Target, Palette, CheckCircle, AlertCircle } from "lucide-react";
import { rgbToHsv } from "@/utils/colorConversions";
import { useFeatures } from "@/contexts/FeaturesContext";
import { generateClinicalSuggestion } from "@/utils/clinicalSuggestions";
import { Label } from "./ui/label";

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
  const showHSV = isFeatureEnabled("useHSV");

  // Debug clinical suggestions implementation more extensively
  useEffect(() => {
    if (pixelData) {
      // EXTENDED DEBUG LOGGING
      console.log("DETAILED Clinical Suggestions Debug:", {
        masterToggle: features.aiMasterToggle,
        clinicalSuggestionsFeatureFlag: features.useClinicalSuggestions,
        isEnabledCheck: isFeatureEnabled("useClinicalSuggestions"),
        hasLabData: !!pixelData.lab,
        labData: pixelData.lab,
        hasVitaLab: !!pixelData.vitaLab,
        vitaLabValue: pixelData.vitaLab, // Show actual value or undefined
        shadeName: pixelData.vitaShade,
        entirePixelData: pixelData, // Log the entire object for inspection
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
          console.log("==== DETAILED SHADE ANALYSIS ====");
          console.log(
            `Tooth Sample: L*=${pixelData.lab.L.toFixed(1)}, a*=${pixelData.lab.a.toFixed(1)}, b*=${pixelData.lab.b.toFixed(1)}`
          );
          console.log(
            `${pixelData.vitaShade} Reference: L*=${pixelData.vitaLab.L.toFixed(1)}, a*=${pixelData.vitaLab.a.toFixed(1)}, b*=${pixelData.vitaLab.b.toFixed(1)}`
          );
          console.log(
            `Differences: ΔL*=${suggestion.difference.deltaL.toFixed(1)}, Δa*=${suggestion.difference.deltaA.toFixed(1)}, Δb*=${suggestion.difference.deltaB.toFixed(1)}, ΔE=${suggestion.difference.deltaE.toFixed(1)}`
          );
          console.log(
            `Significance: L*=${Math.abs(suggestion.difference.deltaL) > 3 ? "YES" : "no"}, a*=${Math.abs(suggestion.difference.deltaA) > 1.5 ? "YES" : "no"}, b*=${Math.abs(suggestion.difference.deltaB) > 2 ? "YES" : "no"}, ΔE=${suggestion.difference.deltaE > 3.3 ? "YES" : "no"}`
          );
          console.log(`Clinical suggestion: ${suggestion.text}`);
          console.log("================================");
        } catch (err) {
          console.error("Error generating clinical suggestions:", err);
        }
      }
    }
  }, [pixelData, isFeatureEnabled, features]);

  if (!pixelData) {
    return (
      <div className="bg-gradient-to-br from-[#ecedef] to-gray-100 border-0 transition-all duration-300 rounded-xl overflow-hidden">
        <div className="p-3 md:p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-0.5">
                Ready to Analyze
              </h3>
              <p className="text-gray-600 text-xs leading-tight">
                Click on the image to analyze color values and get detailed
                shade recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    rgb,
    lab,
    adjustedLab,
    vitaShade,
    vitaLab,
    deltaE,
    position,
    sampleSize = 1,
    calibrationLab,
    shadeFamilyExplanation,
  } = pixelData;

  console.log("ColorDataPanel vitaShade:", vitaShade, typeof vitaShade);

  // Determine match quality and styling
  const getMatchQuality = (deltaE: number) => {
    if (deltaE < 2)
      return {
        quality: "Excellent",
        color: "green",
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
      };
    if (deltaE < 5)
      return {
        quality: "Good",
        color: "blue",
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
      };
    return {
      quality: "Poor",
      color: "red",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
    };
  };

  const matchQuality = getMatchQuality(deltaE);

  return (
    <div className="bg-gradient-to-br from-[#ecedef] to-gray-100 border-0 transition-all duration-300 rounded-xl overflow-hidden">
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Color Swatch and Shade Match */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4">
          <div className="flex flex-col items-center space-y-1 md:space-y-2">
            <div className="relative">
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl border-2 md:border-3 border-gray-200"
                style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <Eye className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
              </div>
            </div>
            {sampleSize > 1 && (
              <div className="text-center">
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {sampleSize}×{sampleSize}px area
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2 md:space-y-3 w-full md:w-auto">
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1 block text-center md:text-left">
                Best VITA Match
              </Label>
              <div className="flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-2">
                <Badge
                  className={`text-sm md:text-base font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg ${matchQuality.bg} ${matchQuality.border} ${matchQuality.text}`}
                >
                  {typeof vitaShade === "string"
                    ? vitaShade
                    : vitaShade
                      ? String(vitaShade)
                      : "Unknown"}
                </Badge>
                {calibrationLab && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Calibrated</span>
                  </div>
                )}
              </div>
            </div>

            {shadeFamilyExplanation && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-1.5 md:p-2">
                <p className="text-xs text-indigo-800 font-medium text-center md:text-left">
                  {shadeFamilyExplanation}
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-gray-200" />

        {/* Match Quality Assessment */}
        <div className="space-y-2 md:space-y-3">
          <Label className="text-sm md:text-base font-semibold text-gray-800 flex items-center gap-1 md:gap-2 justify-center md:justify-start">
            <Target className="w-5 h-5 text-blue-600" />
            Match Quality
          </Label>

          <div className="bg-gradient-to-br from-gray-100 to-[#ecedef] p-3 md:p-4 rounded-md md:rounded-lg border border-gray-200">
            {/* Confidence Score */}
            {pixelData.confidenceScore !== undefined && (
              <div className="mb-3 md:mb-4">
                <div className="flex justify-between items-center mb-1 md:mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Overall Confidence
                  </span>
                  <div className="px-2 py-0.5 text-xs font-bold bg-gray-700 text-gray-100 rounded-md">
                    {pixelData.confidenceScore.toFixed(0)}%
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mb-1">
                  <div
                    className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${
                      pixelData.confidenceScore > 80
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : pixelData.confidenceScore > 60
                          ? "bg-gradient-to-r from-blue-500 to-blue-600"
                          : pixelData.confidenceScore > 40
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}
                    style={{ width: `${pixelData.confidenceScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center md:text-left leading-tight">
                  {pixelData.confidenceScore > 80
                    ? "Excellent confidence"
                    : pixelData.confidenceScore > 60
                      ? "Good confidence"
                      : pixelData.confidenceScore > 40
                        ? "Moderate confidence"
                        : "Low confidence"}
                </p>
              </div>
            )}

            {/* LAB Delta E Score */}
            <div className="mb-2 md:mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-700">
                  LAB Color Difference (ΔE)
                </span>
                <div
                  className={`px-2 py-0.5 text-xs font-bold rounded-md ${matchQuality.bg} ${matchQuality.border} ${matchQuality.text}`}
                >
                  {deltaE.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center gap-1 justify-center md:justify-start">
                {deltaE < 2 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : deltaE < 5 ? (
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <p className="text-xs text-gray-600 leading-tight">
                  {deltaE < 2
                    ? "Excellent match - Clinically acceptable"
                    : deltaE < 5
                      ? "Good match - Minor difference"
                      : "Poor match - Significant difference"}
                </p>
              </div>
            </div>

            {/* HSV Difference */}
            {showHSV && pixelData.deltaHSV !== undefined && (
              <div className="pt-2 md:pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-purple-700">
                    HSV Match Score
                  </span>
                  <div className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 rounded-md">
                    {pixelData.deltaHSV.toFixed(3)}
                  </div>
                </div>
                <p className="text-xs text-purple-600 text-center md:text-left leading-tight">
                  HSV matching considers hue, saturation and value differences
                </p>
              </div>
            )}

            {/* VITA Reference Values */}
            {vitaLab && (
              <div className="pt-2 md:pt-3 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-0.5 md:gap-0">
                  <span className="text-xs font-semibold text-gray-700 text-center md:text-left">
                    Standard Reference ({vitaShade})
                  </span>
                  <span className="text-xs text-gray-600 font-mono text-center md:text-right">
                    L*{vitaLab.L.toFixed(1)} a*{vitaLab.a.toFixed(1)} b*
                    {vitaLab.b.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Info */}
        <div className="bg-gray-100 p-2 md:p-3 rounded-md md:rounded-lg border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-0.5 md:gap-0 text-xs">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 font-medium">
                Analysis Point: ({position.x}, {position.y})
              </span>
            </div>
            {pixelData.sampleSize && (
              <span className="text-gray-600 font-medium">
                {pixelData.sampleSize}×{pixelData.sampleSize} pixels
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorDataPanel;
