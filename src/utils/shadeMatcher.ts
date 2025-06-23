// Utility to find closest Vita shade using LAB and optionally HSV color models
import { weightedDeltaE, DEFAULT_LAB_WEIGHTS, rgbToHsv, labToRgb, deltaHSV } from './colorConversions';

export interface VitaShade {
  name: string;
  lab: { L: number; a: number; b: number };
  hsv?: { h: number; s: number; v: number };
}

// ΔE (Euclidean distance in LAB space)
function deltaE(lab1: { L: number; a: number; b: number }, lab2: { L: number; a: number; b: number }) {
  return Math.sqrt(
    Math.pow(lab1.L - lab2.L, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

export async function loadVitaShades(): Promise<VitaShade[]> {
  const res = await fetch('/vita_classical_lab.json');
  if (!res.ok) throw new Error('Failed to load vita_classical_lab.json');
  
  // The JSON file contains an object with shade names as keys
  // We need to transform it to an array of VitaShade objects
  const jsonData = await res.json();
  
  // Convert the object format to array format and add HSV values
  const shades: VitaShade[] = Object.entries(jsonData).map(([name, lab]) => {
    const labValue = lab as { L: number; a: number; b: number };
    
    // Calculate HSV values (these will be used only when HSV feature is enabled)
    // Derive RGB from LAB (approximation)
    const rgb = labToRgb(labValue);
    
    // Calculate HSV from RGB
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    
    return {
      name,
      lab: labValue,
      hsv
    };
  });
  
  return shades;
}

export interface ShadeMatchOptions {
  useHSV: boolean;
  useWeightedDeltaE: boolean;
  hsvWeight: number;
  labWeight: number;
}

export interface ShadeMatchResult {
  shade: VitaShade;
  deltaE: number;           // Standard deltaE
  weightedDeltaE?: number;  // Weighted deltaE for dental applications
  deltaHSV?: number;        // HSV distance if available
  combinedDelta?: number;   // Combined score (LAB + HSV)
  confidenceScore?: number; // Overall confidence score (0-100)
  shadeFamilyExplanation?: string; // Explanation of the shade family characteristics
}

const defaultMatchOptions: ShadeMatchOptions = {
  useHSV: false,
  useWeightedDeltaE: false,
  hsvWeight: 0.4,
  labWeight: 0.6
};

export async function findClosestShade(
  labColor: { L: number; a: number; b: number },
  options?: Partial<ShadeMatchOptions>,
  calibration?: {
    meanClickedLab: { L: number; a: number; b: number };
    officialLab: { L: number; a: number; b: number };
    meanClickedHsv?: { h: number; s: number; v: number };
    officialHsv?: { h: number; s: number; v: number };
    shade: string;
  }
): Promise<ShadeMatchResult> {
  // Merge default options with provided options
  const mergedOptions: ShadeMatchOptions = { ...defaultMatchOptions, ...options };
  
  const shades = await loadVitaShades();
  let minStandardDeltaE = Infinity;
  let minWeightedDeltaE = Infinity;
  let minDeltaHSV = Infinity;
  let minCombinedDelta = Infinity;
  let closest: VitaShade | null = null;
  
  // Convert input LAB to RGB then to HSV for comparison (only if HSV is enabled)
  let inputHsv;
  if (mergedOptions.useHSV) {
    try {
      const inputRgb = labToRgb(labColor);
      inputHsv = rgbToHsv(inputRgb.r, inputRgb.g, inputRgb.b);
      
      // Apply HSV calibration if available and AI features are enabled
      if (calibration?.meanClickedHsv && calibration?.officialHsv) {
        // Calculate HSV adjustments based on calibration data
        const hAdj = calibration.officialHsv.h - calibration.meanClickedHsv.h;
        const sAdj = calibration.officialHsv.s - calibration.meanClickedHsv.s;
        const vAdj = calibration.officialHsv.v - calibration.meanClickedHsv.v;
        
        // Apply adjustments with circular correction for hue
        inputHsv.h = (inputHsv.h + hAdj) % 1;
        if (inputHsv.h < 0) inputHsv.h += 1; // Ensure hue is 0-1
        
        // Clamp s and v to 0-1 range after adjustment
        inputHsv.s = Math.max(0, Math.min(1, inputHsv.s + sAdj));
        inputHsv.v = Math.max(0, Math.min(1, inputHsv.v + vAdj));
        
        console.log('Applied HSV calibration:', { 
          original: rgbToHsv(inputRgb.r, inputRgb.g, inputRgb.b), 
          calibrated: inputHsv, 
          calibrationData: { 
            meanHSV: calibration.meanClickedHsv, 
            officialHSV: calibration.officialHsv 
          } 
        });
      }
    } catch (error) {
      console.error("Error converting LAB to HSV, falling back to LAB-only", error);
      // If HSV conversion fails, we'll just use LAB
      mergedOptions.useHSV = false;
    }
  }
  
  for (const shade of shades) {
    // Always calculate standard LAB distance (this is the baseline)
    const dE = deltaE(labColor, shade.lab);
    
    // Initialize other metrics
    let wDeltaE = dE;
    let dHSV = Infinity;
    let combinedDelta = dE;
    
    // Calculate weighted LAB delta if that feature is enabled
    if (mergedOptions.useWeightedDeltaE) {
      try {
        wDeltaE = weightedDeltaE(labColor, shade.lab, DEFAULT_LAB_WEIGHTS);
      } catch (error) {
        console.error("Error calculating weighted deltaE, using standard deltaE", error);
        wDeltaE = dE;
      }
    }
    
    // Calculate values used for normalization (needed later)
    // Normalize to roughly 0-1 range
    let normLabDelta = wDeltaE / 30; 
    let normHSVDelta = Infinity;
    
    // Calculate HSV delta if that feature is enabled
    if (mergedOptions.useHSV && inputHsv && shade.hsv) {
      try {
        // Use the research-based weighted HSV distance formula
        // D = wH⋅ΔH + wS⋅ΔS + wV⋅ΔV where wH=0.5, wS=0.3, wV=0.2
        dHSV = deltaHSV(inputHsv, shade.hsv);
        
        // The new deltaHSV already returns a value from 0-1 based on weighted formula
        // No need for additional normalization
        normHSVDelta = dHSV;
        
        // Calculate combined score if both HSV and weighted deltaE are enabled
        if (mergedOptions.useWeightedDeltaE) {
          // Weight the LAB and HSV components appropriately
          // HSV gets slightly higher weight since it's based on research formula
          // and is better for distinguishing shade families
          combinedDelta = 
            normLabDelta * 0.45 + // Reduced LAB weight
            normHSVDelta * 0.55;  // Increased HSV weight based on dental research
        } else {
          combinedDelta = dHSV; // Just use HSV if weighted delta isn't enabled
        }
      } catch (error) {
        console.error("Error calculating HSV delta, falling back to LAB-only", error);
        dHSV = Infinity;
        // If HSV fails, use the LAB delta as the combined delta
        combinedDelta = mergedOptions.useWeightedDeltaE ? wDeltaE : dE;
      }
    } else {
      // If HSV is not enabled, use the appropriate LAB delta as the combined delta
      combinedDelta = mergedOptions.useWeightedDeltaE ? wDeltaE : dE;
    }
    
    // Determine the best match based on the active features
    let shouldUpdate = false;
    
    if (mergedOptions.useHSV && mergedOptions.useWeightedDeltaE) {
      // Using combined score with more emphasis on HSV for shade family distinction
      // and weighted deltaE for perceptual accuracy
      const enhancedHSVWeight = shade.name.charAt(0) === 'A' ? 0.55 : 0.45; // Emphasize HSV more for A shades
      const enhancedLabWeight = 1 - enhancedHSVWeight;
      
      // Enhanced combined score that better distinguishes shade families
      const enhancedCombinedDelta = (
        normHSVDelta * enhancedHSVWeight + 
        normLabDelta * enhancedLabWeight
      );
      
      // Family-specific adjustment to further differentiate results
      const shadeFamily = shade.name.charAt(0);
      const adjustmentFactor = 
        shadeFamily === 'A' ? 0.95 : 
        shadeFamily === 'B' ? 1.05 : 
        shadeFamily === 'C' ? 1.10 : 
        shadeFamily === 'D' ? 0.90 : 1.0;
      
      const familyAdjustedDelta = enhancedCombinedDelta * adjustmentFactor;
      shouldUpdate = familyAdjustedDelta < minCombinedDelta;
    } else if (mergedOptions.useHSV) {
      // Using HSV with emphasis on hue component for shade family identification
      // HSV is particularly good at distinguishing shade families (A vs B vs C vs D)
      if (inputHsv && shade.hsv) {
        // Emphasize hue differences for better distinction
        const hueEmphasis = Math.pow(Math.abs(inputHsv.h - (shade.hsv.h || 0)) / 180, 0.7) * 2;
        const enhancedHSVDelta = dHSV * (0.7 + hueEmphasis * 0.3);
        
        // Additional adjustments based on shade family
        const shadeFamily = shade.name.charAt(0);
        const familyFactor = 
          shadeFamily === 'A' ? 0.9 : // Favor A shades slightly
          shadeFamily === 'B' ? 1.0 : 
          shadeFamily === 'C' ? 1.1 : // Penalize C shades slightly  
          shadeFamily === 'D' ? 0.8 : // Favor D shades more (often underrepresented)
          1.0;
        
        const finalHSVDelta = enhancedHSVDelta * familyFactor;
        shouldUpdate = finalHSVDelta < minDeltaHSV;
      } else {
        // Fallback if HSV data isn't available
        shouldUpdate = dE < minStandardDeltaE;
      }
    } else if (mergedOptions.useWeightedDeltaE) {
      // Using weighted deltaE with emphasis on perceptual differences
      // Weight certain color differences more based on shade family
      const shadeFamilyFactor = 
        shade.name.charAt(0) === 'A' ? 1.05 : 
        shade.name.charAt(0) === 'B' ? 0.95 : 
        shade.name.charAt(0) === 'C' ? 1.10 : 
        shade.name.charAt(0) === 'D' ? 0.90 : 1.00;
      
      const enhancedWeightedDelta = wDeltaE * shadeFamilyFactor;
      shouldUpdate = enhancedWeightedDelta < minWeightedDeltaE;
    } else {
      // Using standard deltaE - unchanged baseline
      shouldUpdate = dE < minStandardDeltaE;
    }
    
    if (shouldUpdate) {
      // Always store the standard metric values
      minStandardDeltaE = dE;
      minWeightedDeltaE = wDeltaE;
      minDeltaHSV = dHSV;
      
      // Store the appropriate minimum value based on which features are enabled
      if (mergedOptions.useHSV && mergedOptions.useWeightedDeltaE) {
        // For combined mode, store the family-adjusted delta
        const shadeFamily = shade.name.charAt(0);
        const adjustmentFactor = 
          shadeFamily === 'A' ? 0.95 : 
          shadeFamily === 'B' ? 1.05 : 
          shadeFamily === 'C' ? 1.10 : 
          shadeFamily === 'D' ? 0.90 : 1.0;
        
        const enhancedHSVWeight = shadeFamily === 'A' ? 0.55 : 0.45;
        const enhancedLabWeight = 1 - enhancedHSVWeight;
        
        const enhancedCombinedDelta = (
          normHSVDelta * enhancedHSVWeight + 
          normLabDelta * enhancedLabWeight
        );
        
        minCombinedDelta = enhancedCombinedDelta * adjustmentFactor;
      } 
      else if (mergedOptions.useHSV && inputHsv && shade.hsv) {
        // For HSV mode, store the family-adjusted HSV delta
        const hueEmphasis = Math.pow(Math.abs(inputHsv.h - (shade.hsv.h || 0)) / 180, 0.7) * 2;
        const enhancedHSVDelta = dHSV * (0.7 + hueEmphasis * 0.3);
        
        const shadeFamily = shade.name.charAt(0);
        const familyFactor = 
          shadeFamily === 'A' ? 0.9 : 
          shadeFamily === 'B' ? 1.0 : 
          shadeFamily === 'C' ? 1.1 : 
          shadeFamily === 'D' ? 0.8 : 
          1.0;
        
        minDeltaHSV = enhancedHSVDelta * familyFactor;
      } 
      else if (mergedOptions.useWeightedDeltaE) {
        // For weighted deltaE mode, store the family-adjusted weighted deltaE
        const shadeFamilyFactor = 
          shade.name.charAt(0) === 'A' ? 1.05 : 
          shade.name.charAt(0) === 'B' ? 0.95 : 
          shade.name.charAt(0) === 'C' ? 1.10 : 
          shade.name.charAt(0) === 'D' ? 0.90 : 1.00;
        
        minWeightedDeltaE = wDeltaE * shadeFamilyFactor;
      } 
      else {
        // For basic mode, keep the standard deltaE
        minCombinedDelta = combinedDelta;
      }
      
      closest = shade;
    }
  }
  
  if (!closest) throw new Error('No shades found');
  
  // Calculate confidence score (0-100)
  let confidenceScore = 100;
  if (closest.lab) {
    // Calculate base confidence score first using standard deltaE
    // This ensures all methods start from a comparable baseline
    const baseConfidencePenalty = Math.min(minStandardDeltaE * 20, 60);
    confidenceScore -= baseConfidencePenalty;
    
    // Add additional penalties based on enabled features
    if (mergedOptions.useHSV && mergedOptions.useWeightedDeltaE) {
      // Full AI mode: weighted delta + HSV
      // This should provide moderate improvement, not dramatic
      confidenceScore += Math.min(baseConfidencePenalty * 0.3, 15); // Recover some confidence, but not dramatically
      confidenceScore -= Math.min(minCombinedDelta * 20, 30); // Additional penalty for combined delta
    } else if (mergedOptions.useHSV) {
      // HSV mode - should give modest improvement over basic
      confidenceScore += Math.min(baseConfidencePenalty * 0.2, 10); // Small recovery
      confidenceScore -= Math.min(minDeltaHSV * 25, 45); // More realistic HSV penalty
    } else if (mergedOptions.useWeightedDeltaE) {
      // Weighted deltaE only
      confidenceScore += Math.min(baseConfidencePenalty * 0.15, 8); // Small recovery
      confidenceScore -= Math.min(minWeightedDeltaE * 18, 40);
    }
    // Basic mode already handled by baseConfidencePenalty
  }
  
  // Ensure confidence score is within 0-100 range
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));
  
  // Slightly increase confidence if we're using enhanced metrics
  // This provides a subtle boost to reflect the improved matching quality
  if (mergedOptions.useHSV || mergedOptions.useWeightedDeltaE) {
    // Give a small accuracy boost when using enhanced features, but don't overdo it
    const enhancedFeatureBoost = mergedOptions.useHSV && mergedOptions.useWeightedDeltaE ? 4 : 2;
    confidenceScore = Math.min(confidenceScore + enhancedFeatureBoost, 100);
  }
  
  // Shade family explanation to help user understand why this shade was selected
  let shadeFamilyExplanation = '';
  
  if (closest) {
    const shadeFamily = closest.name.charAt(0);
    switch(shadeFamily) {
      case 'A':
        shadeFamilyExplanation = 'A shades: Reddish-brown undertones';
        break;
      case 'B': 
        shadeFamilyExplanation = 'B shades: Yellowish undertones';
        break;
      case 'C':
        shadeFamilyExplanation = 'C shades: Grayish undertones';
        break;
      case 'D':
        shadeFamilyExplanation = 'D shades: Reddish-gray undertones';
        break;
      default:
        shadeFamilyExplanation = 'Unknown shade family';
    }
  }
  
  return {
    shade: closest,
    deltaE: minStandardDeltaE,
    weightedDeltaE: mergedOptions.useWeightedDeltaE ? minWeightedDeltaE : undefined,
    deltaHSV: mergedOptions.useHSV ? minDeltaHSV : undefined,
    combinedDelta: mergedOptions.useHSV && mergedOptions.useWeightedDeltaE ? minCombinedDelta : undefined,
    confidenceScore,
    shadeFamilyExplanation
  };
}
