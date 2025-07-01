import * as React from "react";
import { Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatures } from "@/contexts/FeaturesContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface AIFeaturesPanelProps {
  // Optional props can be added here if needed
}

// --- Clinical Layering Suggestions Info Popover ---
export const ClinicalLayeringInfo: React.FC = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        className="ml-2 flex items-center justify-center"
        aria-label="Information about clinical layering suggestions"
      >
        <Info className="w-4 h-4 text-gray-700" />
      </button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md bg-[#ECEDEF] text-black font-manrope border border-gray-300 shadow-lg z-[9999]">
      <DialogHeader>
        <DialogTitle className="text-black font-manrope">
          Clinical Layering Suggestions
        </DialogTitle>
        <DialogDescription className="text-black font-manrope">
          <div className="mt-2 text-left text-sm">
            <p className="mb-2">
              <span className="font-bold">What it does:</span> Recommends how to
              build up a restoration using multiple composite or ceramic layers
              for the best shade match.
            </p>
            <ul className="text-xs list-disc pl-4 mb-2">
              <li>Analyzes your tooth's LAB values vs. VITA reference</li>
              <li>
                Suggests layer materials and opacities based on color
                differences
              </li>
            </ul>
            <div className="text-xs mt-2">
              <span className="font-semibold">Clinical value:</span> Helps you
              select the right layering technique for a natural result.
              <br />
              <span className="font-semibold">Example:</span> If the tooth is
              lighter than reference, use a more translucent enamel or brighter
              dentin layer.
            </div>
          </div>
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end mt-4">
        <DialogClose className="px-4 py-2 text-sm font-medium text-black bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
          Close
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
);

const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = () => {
  const {
    features,
    toggleFeature,
    circleSizeSettings,
    updateCircleSizeSettings,
    exposureMaskSettings,
    updateExposureMaskSettings,
  } = useFeatures();
  return (
    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-md border-[#e6e7ea]">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-gray-800 manrope-light">
          AI Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* ALL AI Toggle */}
        <div className="py-2 flex flex-row items-center justify-between border-b border-[#e6e7ea]">
          <div className="flex flex-col justify-center">
            <span className="font-semibold text-gray-700">ALL AI</span>
            <span className="text-sm text-gray-700 ml-2">
              Controls all implemented features
            </span>
          </div>
          <div className="flex items-center">
            <Switch
              id="all-ai"
              className="data-[state=checked]:bg-gray-400 data-[state=unchecked]:bg-gray-200"
              checked={features.aiMasterToggle}
              onCheckedChange={() => toggleFeature("aiMasterToggle")}
            />
          </div>
        </div>

        {/* HSV Color Space */}
        <div className="py-3 flex flex-row items-center justify-between border-b border-[#e6e7ea]">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center">
              <span className="font-medium text-gray-700">HSV Color Space</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="inline-flex">
                    <Info className="w-4 h-4 ml-2 text-gray-700 cursor-pointer hover:text-gray-700" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#ECEDEF] text-black font-manrope border border-gray-300 shadow-lg z-[9999]">
                  <DialogHeader>
                    <DialogTitle className="text-black font-manrope">
                      HSV Color Space
                    </DialogTitle>
                    <DialogDescription className="text-black font-manrope">
                      <div className="mt-2 text-left text-sm">
                        <p className="mb-2">
                          <span className="font-bold">What it does:</span> HSV
                          Color Space uses hue, saturation, and value to analyze
                          tooth color. This can distinguish subtle shade
                          differences that LAB may miss.
                        </p>
                        <ul className="text-xs list-disc pl-4 mb-2">
                          <li>Improves shade family detection (A, B, C, D)</li>
                          <li>Helps spot translucency and color intensity</li>
                        </ul>
                        <div className="text-xs mt-2">
                          <span className="font-semibold">Example:</span> HSV
                          can tell apart two shades with similar brightness but
                          different hues, helping you select the best match.
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end mt-4">
                    <DialogClose className="px-4 py-2 text-sm font-medium text-black bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                      Close
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
              <div
                className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${features.useHSV ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}
              >
                {features.useHSV ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1">
              Enhanced shade matching using hue, saturation, and value color
              space
            </p>
          </div>
          <div className="flex items-center">
            <Switch
              id="hsv-toggle"
              className="data-[state=checked]:bg-gray-400 data-[state=unchecked]:bg-gray-200"
              checked={features.useHSV}
              onCheckedChange={() => toggleFeature("useHSV")}
            />
          </div>
        </div>

        {/* Exposure Masking Feature */}
        <div className="py-3 flex flex-row items-center justify-between border-b border-[#e6e7ea]">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center">
              <span className="font-medium text-gray-700">
                Exposure Masking
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="ml-2 flex items-center justify-center"
                    aria-label="Information about exposure masking"
                  >
                    <Info className="w-4 h-4 text-gray-700" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#ECEDEF] text-black font-manrope border border-gray-300 shadow-lg z-[9999]">
                  <DialogHeader>
                    <DialogTitle className="text-black font-manrope">
                      Exposure Masking
                    </DialogTitle>
                    <DialogDescription className="text-black font-manrope">
                      <div className="mt-2 text-left text-sm">
                        <p className="mb-2">
                          <span className="font-bold">What it does:</span>{" "}
                          Detects and masks areas that are too bright or too
                          dark in your image to prevent unreliable color
                          analysis.
                        </p>
                        <ul className="text-xs list-disc pl-4 mb-2">
                          <li>Overexposed: RGB &gt; 245 (red overlay)</li>
                          <li>Underexposed: RGB &lt; 25 (blue overlay)</li>
                          <li>
                            Masked pixels are excluded from color analysis
                          </li>
                        </ul>
                        <div className="text-xs mt-2">
                          <span className="font-semibold">Clinical value:</span>{" "}
                          Ensures only valid, clinically meaningful regions are
                          used for shade matching.
                          <br />
                          <span className="font-semibold">Example:</span> A
                          white flash spot or deep shadow is ignored to avoid
                          skewing shade results.
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end mt-4">
                    <DialogClose className="px-4 py-2 text-sm font-medium text-black bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                      Close
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
              <div
                className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${features.useExposureMasking ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}
              >
                {features.useExposureMasking ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1">
              Exclude over- and underexposed pixels from color analysis
            </p>
          </div>
          <div className="flex items-center">
            <Switch
              id="exposure-masking-toggle"
              className="data-[state=checked]:bg-gray-400 data-[state=unchecked]:bg-gray-200"
              checked={features.useExposureMasking}
              onCheckedChange={() => toggleFeature("useExposureMasking")}
            />
          </div>
        </div>

        {/* Exposure Mask Intensity Slider - Only shown when masking is enabled */}
        {features.useExposureMasking && (
          <div className="py-3 pl-4 pr-2 flex flex-col border-b border-gray-100 bg-gray-50 rounded-md mt-1 mb-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Mask Intensity
              </label>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(exposureMaskSettings.maskIntensity * 100)}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-700">10%</span>
              <Slider
                value={[exposureMaskSettings.maskIntensity * 100]}
                min={10}
                max={100}
                step={2}
                className="flex-1 bg-gray-300"
                onValueChange={(values) => {
                  updateExposureMaskSettings({
                    maskIntensity: values[0] / 100,
                  });
                }}
              />
              <span className="text-xs text-gray-700">100%</span>
            </div>
            <p className="text-xs text-gray-700 mt-1">
              Adjusts how aggressively masking is applied to over/underexposed
              areas
            </p>
          </div>
        )}

        {/* Circle Size Controls */}
        <div className="py-3 flex flex-col border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-medium text-gray-700">
                Calibration Circle Size
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
              {Math.round(circleSizeSettings.calibrationCircleScale * 100)}%
            </span>
          </div>
          <Slider
            defaultValue={[circleSizeSettings.calibrationCircleScale * 100]}
            max={500}
            min={20}
            step={5}
            onValueChange={(values) => {
              const scale = values[0] / 100;
              updateCircleSizeSettings({ calibrationCircleScale: scale });
            }}
            className="my-1 bg-gray-300"
          />
          <p className="text-xs text-gray-700 mt-1">
            Adjust the size of calibration sampling circles (20% to 500%)
          </p>
        </div>

        {/* Analysis Circle Size Control */}
        <div className="py-3 flex flex-col border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-medium text-gray-700">
                Analysis Circle Size
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
              {Math.round(circleSizeSettings.analysisCircleScale * 100)}%
            </span>
          </div>
          <Slider
            defaultValue={[circleSizeSettings.analysisCircleScale * 100]}
            max={500}
            min={20}
            step={5}
            onValueChange={(values) => {
              const scale = values[0] / 100;
              updateCircleSizeSettings({ analysisCircleScale: scale });
            }}
            className="my-1 bg-gray-300"
          />
          <p className="text-xs text-gray-700 mt-1">
            Adjust the size of tooth analysis sampling circle (20% to 500%)
          </p>
        </div>

        {/* Weighted Delta-E */}
        <div className="py-3 flex flex-row items-center justify-between border-b border-gray-100">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center">
              <span className="font-medium text-gray-700">
                Weighted Delta-E
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="inline-flex">
                    <Info className="w-4 h-4 ml-2 text-gray-700 cursor-pointer hover:text-gray-700" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#ECEDEF] text-black font-manrope border border-gray-300 shadow-lg z-[9999]">
                  <DialogHeader>
                    <DialogTitle className="text-black font-manrope">
                      Weighted Delta-E
                    </DialogTitle>
                    <DialogDescription className="text-black font-manrope">
                      <div className="mt-2 text-left text-sm">
                        <p className="mb-2">
                          <span className="font-bold">What it does:</span>{" "}
                          Weighted Delta-E gives more importance to color
                          differences that matter most for tooth shade matching,
                          making results more clinically relevant.
                        </p>
                        <ul className="text-xs list-disc pl-4 mb-2">
                          <li>
                            Focuses on color shifts that are most visible to the
                            human eye
                          </li>
                          <li>Improves confidence in shade selection</li>
                        </ul>
                        <div className="text-xs mt-2">
                          <span className="font-semibold">Example:</span> If two
                          teeth differ mainly in yellow/blue, Weighted Delta-E
                          highlights this so you can adjust your shade choice
                          accordingly.
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end mt-4">
                    <DialogClose className="px-4 py-2 text-sm font-medium text-black bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                      Close
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
              <div
                className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${features.useWeightedDeltaE ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}
              >
                {features.useWeightedDeltaE ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-1">
              Uses perceptual weighting to improve LAB color difference
              calculations
            </p>
          </div>
          <div className="flex items-center">
            <Switch
              id="weighted-delta-toggle"
              className="data-[state=checked]:bg-gray-400 data-[state=unchecked]:bg-gray-200"
              checked={features.useWeightedDeltaE}
              onCheckedChange={() => toggleFeature("useWeightedDeltaE")}
            />
          </div>
        </div>

        {/* Clinical Suggestions */}
        <div className="py-3 flex flex-row items-center justify-between border-b border-[#e6e7ea]">
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center">
              <span className="font-medium text-gray-700">
                Clinical Layering Suggestions
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="inline-flex">
                    <Info className="w-4 h-4 ml-2 text-gray-700 cursor-pointer hover:text-gray-700" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#ECEDEF] text-black font-manrope border border-gray-300 shadow-lg z-[9999]">
                  <DialogHeader>
                    <DialogTitle className="text-black font-manrope">
                      Clinical Layering Suggestions
                    </DialogTitle>
                    <DialogDescription className="text-black font-manrope">
                      <div className="mt-2 text-left text-sm">
                        <p className="mb-2">
                          <span className="font-bold">What it does:</span>{" "}
                          Recommends how to build up a restoration using
                          multiple composite or ceramic layers for the best
                          shade match.
                        </p>
                        <ul className="text-xs list-disc pl-4 mb-2">
                          <li>
                            Analyzes your tooth's LAB values vs. VITA reference
                          </li>
                          <li>
                            Suggests layer materials and opacities based on
                            color differences
                          </li>
                        </ul>
                        <div className="text-xs mt-2">
                          <span className="font-semibold">Clinical value:</span>{" "}
                          Helps you select the right layering technique for a
                          natural result.
                          <br />
                          <span className="font-semibold">Example:</span> If the
                          tooth is lighter than reference, use a more
                          translucent enamel or brighter dentin layer.
                        </div>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end mt-4">
                    <DialogClose className="px-4 py-2 text-sm font-medium text-black bg-gray-300 rounded-md hover:bg-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                      Close
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
              <div
                className={`ml-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${features.useClinicalSuggestions ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}
              >
                {features.useClinicalSuggestions ? "Active" : "Inactive"}
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Get layering and blend recommendations for better shade matching
            </p>
          </div>
          <div className="flex items-center">
            <Switch
              id="clinical-suggestions"
              className="data-[state=checked]:bg-gray-400 data-[state=unchecked]:bg-gray-200"
              checked={features.useClinicalSuggestions}
              onCheckedChange={() => toggleFeature("useClinicalSuggestions")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIFeaturesPanel;
