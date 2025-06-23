/**
 * Clinical Suggestions Utility
 * Provides intelligent layering suggestions for dental shade matching
 * Based on the characteristics of dentine (high chroma, opaque, warm),
 * enamel (high translucency, low chroma, cool), and body shades.
 */

// Standard LAB values for VITA Classical shades
// These are approximate values and can be refined with actual measurements
const VITA_SHADE_LAB_VALUES: Record<string, LabColor> = {
  'A1': { L: 79.8, a: 0.3, b: 16.0 },
  'A2': { L: 77.0, a: 1.4, b: 18.0 },
  'A3': { L: 74.7, a: 1.9, b: 21.5 },
  'A3.5': { L: 72.2, a: 2.3, b: 24.0 },
  'A4': { L: 69.0, a: 3.0, b: 26.5 },
  'B1': { L: 81.5, a: -0.5, b: 12.0 },
  'B2': { L: 78.5, a: -0.1, b: 16.5 },
  'B3': { L: 75.0, a: 0.4, b: 19.5 },
  'B4': { L: 72.0, a: 1.0, b: 22.5 },
  'C1': { L: 79.0, a: -0.8, b: 10.5 },
  'C2': { L: 75.0, a: -0.2, b: 14.0 },
  'C3': { L: 72.0, a: 0.2, b: 17.5 },
  'C4': { L: 68.5, a: 0.7, b: 20.0 },
  'D2': { L: 77.0, a: -0.5, b: 12.0 },
  'D3': { L: 73.5, a: 0.0, b: 15.0 },
  'D4': { L: 70.0, a: 0.5, b: 18.0 },
  // Bleach shades
  'OM1': { L: 83.5, a: -0.8, b: 10.0 },
  'OM2': { L: 82.0, a: -0.6, b: 12.0 },
  'OM3': { L: 80.5, a: -0.4, b: 14.0 }
};

// Define LabColor interface inline to avoid dependency issues
interface LabColor {
  L: number;
  a: number;
  b: number;
}

interface ClinicalSuggestion {
  text: string;
  difference: {
    deltaE: number;
    deltaL: number;
    deltaA: number;
    deltaB: number;
    significant: boolean;
  };
  referenceValues: LabColor;
}

// Helper functions to get related shades
function getLighterShade(shade: string): string {
  // Extract family and number (e.g., A3 -> A and 3)
  const family = shade.charAt(0);
  const number = parseInt(shade.substring(1));
  
  // Special case for A3.5
  if (shade === 'A3.5') return 'A3';
  
  // Move up in lightness within family when possible
  if (number > 1) {
    return `${family}${number-1}`;
  }
  
  // For already light shades, suggest bleached options
  if ((family === 'A' || family === 'B') && number === 1) {
    return 'OM1';
  }
  
  // Default case
  return shade;
}

function getDarkerShade(shade: string): string {
  // Extract family and number (e.g., A3 -> A and 3)
  const family = shade.charAt(0);
  const number = parseInt(shade.substring(1));
  
  // Special case for A3.5
  if (shade === 'A3.5') return 'A4';
  
  // Special case for newly added darker shades
  if (shade === 'A4') return 'A5';
  if (shade === 'A5') return 'A6';
  if (shade === 'C4') return 'C5';
  
  // Check for bleached shades
  if (shade.startsWith('OM')) {
    const bleachNumber = parseInt(shade.substring(2));
    if (bleachNumber < 3) {
      return `OM${bleachNumber + 1}`;
    }
    return 'B1'; // Darkest bleached -> lightest regular
  }
  
  // Normal progression within family
  if (family === 'A' || family === 'B' || family === 'C' || family === 'D') {
    return `${family}${number+1}`;
  }
  
  // Default case
  return shade;
}

function getWarmerShade(shade: string): string {
  // Extract family and number
  const family = shade.charAt(0);
  const number = parseInt(shade.substring(1));
  
  // A shades are generally warmer than B, C, D
  if (family === 'B') return `A${number}`;
  if (family === 'C' || family === 'D') {
    // Adjust for different numbering schemes
    return number <= 2 ? 'A3' : 'A4';
  }
  
  // For A shades, increase the number if possible
  if (family === 'A' && number < 4) {
    return `A${number+1}`;
  }
  
  // Default
  return shade;
}

/**
 * Generate clinical suggestion based on differences between the tooth and matched shade
 * @param toothLab LAB values of the analyzed tooth
 * @param shadeName Name of the closest matched shade (e.g., "A3")
 * @param shadeLab LAB values of the matched shade
 * @returns Clinical suggestion object with text and difference data
 */
/**
 * Generate clinical suggestion based on differences between the tooth and matched shade
 * Will use reference shadeLab values if provided, otherwise will look up standard values
 */
export function generateClinicalSuggestion(
  toothLab: LabColor,
  shadeName: string,
  shadeLab?: LabColor  // Made optional
): ClinicalSuggestion {
  
  // If shadeLab is not provided, use our lookup table
  const referenceLabValues = shadeLab || VITA_SHADE_LAB_VALUES[shadeName];
  
  // If we still don't have reference values, provide a basic suggestion
  if (!referenceLabValues) {
    console.warn(`No LAB reference values available for shade ${shadeName}`);
    // Create a default reference value since we must return one
    const defaultRef = { L: 0, a: 0, b: 0 };
    return {
      text: `The closest match is ${shadeName}. For optimal esthetic results: Use ${shadeName} as your base shade with standard layering technique.`,
      difference: { deltaE: 0, deltaL: 0, deltaA: 0, deltaB: 0, significant: false },
      referenceValues: defaultRef
    };
  }
  // Calculate differences in key dimensions
  const deltaL = toothLab.L - referenceLabValues.L;  // Lightness difference
  const deltaA = toothLab.a - referenceLabValues.a;  // Red-green difference
  const deltaB = toothLab.b - referenceLabValues.b;  // Yellow-blue difference
  
  // Calculate total color difference (deltaE)
  const deltaE = Math.sqrt(
    Math.pow(deltaL, 2) + 
    Math.pow(deltaA, 2) + 
    Math.pow(deltaB, 2)
  );
  
  // Check if differences are significant enough for advanced recommendations
  const isSignificantL = Math.abs(deltaL) > 3;    // Significant lightness difference
  const isSignificantA = Math.abs(deltaA) > 1.5;  // Significant red-green difference
  const isSignificantB = Math.abs(deltaB) > 2;    // Significant yellow-blue difference
  const isSignificantE = deltaE > 3.3;            // Significant total difference
  const isSignificant = isSignificantL || isSignificantA || isSignificantB || isSignificantE;
  
  // Begin with the matched shade
  let suggestion = `The closest match is ${shadeName}. `;
  
  if (!isSignificant) {
    // No significant differences to suggest anything special
    suggestion += `Color match is excellent (ΔE: ${deltaE.toFixed(1)}). Use ${shadeName} as a single shade or with standard layering technique.`;
  } else {
    // Has meaningful difference to suggest
    
    // LIGHTNESS DIFFERENCES
    if (deltaL > 3) {  // Tooth is lighter than the matched shade
      suggestion += `The natural tooth appears lighter than ${shadeName} (ΔL: +${deltaL.toFixed(1)}). `;
      suggestion += `Consider: (1) Use ${getLighterShade(shadeName)} enamel over ${shadeName} dentine; or `;
      suggestion += `(2) Increase the thickness of translucent enamel layer relative to the dentine.`;
    } 
    else if (deltaL < -3) {  // Tooth is darker than the matched shade
      suggestion += `The natural tooth appears darker than ${shadeName} (ΔL: ${deltaL.toFixed(1)}). `;
      suggestion += `Consider: (1) Use ${shadeName} enamel over ${getDarkerShade(shadeName)} dentine; or `;
      suggestion += `(2) Increase the thickness of the dentine layer relative to the enamel.`;
    }
    // RED-GREEN DIFFERENCES (a* axis - redness vs. greenness)
    else if (isSignificantA) {
      if (deltaA > 1.5) {  // More red in tooth
        suggestion += `The natural tooth has more reddish/pink tones than standard ${shadeName} (Δa: +${deltaA.toFixed(1)}). `;
        suggestion += `Consider: (1) Add subtle reddish-pink tints to your ${shadeName} dentine layer; or `;
        suggestion += `(2) Select a more chromatic dentine material with increased opacity in cervical areas.`;
      } else if (deltaA < -1.5) {  // More green/gray in tooth
        suggestion += `The natural tooth has more grayish/green undertones than standard ${shadeName} (Δa: ${deltaA.toFixed(1)}). `;
        suggestion += `Consider: (1) Add subtle blue-gray modifiers to your enamel layer; or `;
        suggestion += `(2) Increase the translucency of your enamel layer to create depth effects.`;
      }
    }
    // CHROMA DIFFERENCES (mostly in yellow-blue b* axis for teeth)
    else if (isSignificantB) {
      if (deltaB > 2) {  // More yellow saturation in tooth
        suggestion += `The natural tooth has more yellow/warmth than standard ${shadeName} (Δb: +${deltaB.toFixed(1)}). `;
        suggestion += `Consider: (1) Use ${shadeName} enamel over ${getWarmerShade(shadeName)} dentine; or `;
        suggestion += `(2) Slightly increase the opacity of your restoration.`;
      } else if (deltaB < -2) {  // Less yellow saturation in tooth
        suggestion += `The natural tooth has less yellow/warmth than standard ${shadeName} (Δb: ${deltaB.toFixed(1)}). `;
        suggestion += `Consider: (1) Use ${shadeName} dentine with increased translucent enamel thickness; or `;
        suggestion += `(2) Select a more translucent enamel material.`;
      }
    }
    // If just the total difference is significant, but individual dimensions aren't
    else if (isSignificantE) {
      suggestion += `The overall color difference is significant (ΔE: ${deltaE.toFixed(1)}). `;
      suggestion += `Consider detailed layering with ${shadeName} as your base shade, ` +
                   `and adjust translucency based on the restoration's position and lighting conditions.`;
    }
  }
  
  return {
    text: suggestion,
    difference: {
      deltaE,
      deltaL,
      deltaA,
      deltaB,
      significant: isSignificant
    },
    referenceValues: referenceLabValues
  };
}
