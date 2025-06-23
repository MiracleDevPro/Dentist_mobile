// Color conversion and distance calculation utilities

import { useFeatures } from "@/contexts/FeaturesContext";

// Default weights for dental shade matching
// In dental applications, b* (yellow-blue) is typically most important,
// followed by a* (red-green), with L* (lightness) being slightly less critical
export const DEFAULT_LAB_WEIGHTS = { L: 0.8, a: 1.2, b: 1.5 };

// RGB to HSV conversion
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
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
}

// Convert LAB to approximate RGB (simplified conversion)
export function labToRgb(lab: { L: number; a: number; b: number }): { r: number; g: number; b: number } {
  // Note: This is a simplified conversion and not fully accurate
  // For dental purposes, this approximation should be sufficient
  let y = (lab.L + 16) / 116;
  let x = lab.a / 500 + y;
  let z = y - lab.b / 200;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  let r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  let b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return {
    r: Math.max(0, Math.min(1, r)) * 255,
    g: Math.max(0, Math.min(1, g)) * 255,
    b: Math.max(0, Math.min(1, b)) * 255
  };
}

// Delta HSV (distance in HSV color space)
// Based on dental research with specific weights for H, S, V components
// Paper reference: HSV similarity metric for dental shade matching
export function deltaHSV(
  hsv1: { h: number; s: number; v: number }, 
  hsv2: { h: number; s: number; v: number },
  weights = { h: 0.5, s: 0.3, v: 0.2 } // Default weights from dental research
) {
  // Calculate hue difference accounting for circularity (0-1 range)
  const deltaH = Math.min(Math.abs(hsv1.h - hsv2.h), 1 - Math.abs(hsv1.h - hsv2.h));
  
  // Calculate saturation and value differences (0-1 range)
  const deltaS = Math.abs(hsv1.s - hsv2.s);
  const deltaV = Math.abs(hsv1.v - hsv2.v);
  
  // Use weighted linear combination as specified in the dental research
  // D = wH⋅ΔH + wS⋅ΔS + wV⋅ΔV
  const distance = 
    weights.h * deltaH + 
    weights.s * deltaS + 
    weights.v * deltaV;
    
  return distance;
}

// Weighted ΔE - gives more importance to specific components based on weights
export function weightedDeltaE(
  lab1: { L: number; a: number; b: number }, 
  lab2: { L: number; a: number; b: number },
  weights = DEFAULT_LAB_WEIGHTS
) {
  return Math.sqrt(
    weights.L * Math.pow(lab1.L - lab2.L, 2) +
    weights.a * Math.pow(lab1.a - lab2.a, 2) +
    weights.b * Math.pow(lab1.b - lab2.b, 2)
  );
}

// Utility to get HSV description of color
export function describeHSVColor(hsv: { h: number; s: number; v: number }): string {
  const h = hsv.h * 360; // Convert to degrees
  const s = hsv.s * 100; // Convert to percentage
  const v = hsv.v * 100; // Convert to percentage
  
  let hueDesc = '';
  if (h < 30) hueDesc = 'red';
  else if (h < 60) hueDesc = 'orange-red';
  else if (h < 90) hueDesc = 'yellow-orange';
  else if (h < 150) hueDesc = 'yellow-green';
  else if (h < 195) hueDesc = 'green';
  else if (h < 240) hueDesc = 'cyan';
  else if (h < 270) hueDesc = 'blue';
  else if (h < 290) hueDesc = 'purple';
  else if (h < 330) hueDesc = 'magenta';
  else hueDesc = 'red';
  
  let satDesc = '';
  if (s < 15) satDesc = 'very gray';
  else if (s < 35) satDesc = 'somewhat gray';
  else if (s < 65) satDesc = 'moderately saturated';
  else if (s < 85) satDesc = 'saturated';
  else satDesc = 'very saturated';
  
  let valDesc = '';
  if (v < 15) valDesc = 'very dark';
  else if (v < 35) valDesc = 'dark';
  else if (v < 65) valDesc = 'medium';
  else if (v < 85) valDesc = 'light';
  else valDesc = 'very light';
  
  return `${valDesc} ${satDesc} ${hueDesc}`;
}
