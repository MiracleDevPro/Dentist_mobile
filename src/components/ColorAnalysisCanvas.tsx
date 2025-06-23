import React, { useRef, useEffect, useState, useCallback } from 'react';
import { findClosestShade } from '@/utils/shadeMatcher';
import { useFeatures } from '@/contexts/FeaturesContext';

// Type for pixel data
interface PixelData {
  rgb: { r: number, g: number, b: number };
  lab: { L: number, a: number, b: number };
  vitaShade: string;
  deltaE: number;
  deltaHSV?: number;
  position: { x: number, y: number };
  adjustedLab?: { L: number, a: number, b: number };
  confidenceScore?: number;
}

interface ColorAnalysisCanvasProps {
  imageUrl: string;
  onPixelSelect: (pixelData: PixelData) => void;
  calibrationLab?: { 
    clickedLab: { L: number; a: number; b: number }; 
    officialLab: { L: number; a: number; b: number } 
  };
  calibration?: {
    meanClickedLab: { L: number; a: number; b: number };
    officialLab: { L: number; a: number; b: number };
    meanClickedHsv?: { h: number; s: number; v: number };
    officialHsv?: { h: number; s: number; v: number };
    shade: string;
  };
  calibrationPoints?: { L: number; a: number; b: number; hsv?: { h: number; s: number; v: number } }[];
  calibrationClickPositions?: { x: number; y: number }[];
  calibrationMode?: boolean;
  onCalibrationClick?: (x: number, y: number) => void;
}

// RGB to Lab color space conversion
const rgbToLab = (r: number, g: number, b: number): { L: number; a: number; b: number } => {
  // Normalize RGB values
  r = r / 255;
  g = g / 255;
  b = b / 255;

  // Convert to XYZ color space
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r = r * 100;
  g = g * 100;
  b = b * 100;

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  // Convert XYZ to Lab
  const xRef = 95.047;
  const yRef = 100.0;
  const zRef = 108.883;

  const xNorm = x / xRef;
  const yNorm = y / yRef;
  const zNorm = z / zRef;

  const fx = xNorm > 0.008856 ? Math.pow(xNorm, 1/3) : (7.787 * xNorm) + (16/116);
  const fy = yNorm > 0.008856 ? Math.pow(yNorm, 1/3) : (7.787 * yNorm) + (16/116);
  const fz = zNorm > 0.008856 ? Math.pow(zNorm, 1/3) : (7.787 * zNorm) + (16/116);

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);

  return { L, a, b: bb };
};

// Base circle radius values in pixels - will be scaled by user settings
const BASE_CIRCLE_RADIUS_CALIB = 30; // 60px diameter base size
const BASE_CIRCLE_RADIUS_ANALYSIS = 30; // 60px diameter (doubled from original 30px)
// Dynamic circle radius values - updated based on user settings
let CIRCLE_RADIUS_CALIB = BASE_CIRCLE_RADIUS_CALIB;
let CIRCLE_RADIUS_ANALYSIS = BASE_CIRCLE_RADIUS_ANALYSIS;

// Exposure masking thresholds - these will be overridden by context values
let OVEREXPOSURE_THRESHOLD = 245; // RGB values close to 255 are considered overexposed
let UNDEREXPOSURE_THRESHOLD = 25; // RGB values close to 0 are considered underexposed

interface CalibrationCircle {
  x: number;
  y: number;
  id: number;
}

interface ExposureMask {
  imageData: ImageData | null; // Full mask data
  overexposedPercentage: number; // Percentage of overexposed pixels
  underexposedPercentage: number; // Percentage of underexposed pixels
  totalMaskedPercentage: number; // Total percentage of masked pixels
  width: number;
  height: number;
}

const ColorAnalysisCanvas: React.FC<ColorAnalysisCanvasProps> = ({
  imageUrl,
  onPixelSelect,
  calibrationLab,
  calibration,
  calibrationPoints,
  calibrationClickPositions,
  calibrationMode = false,
  onCalibrationClick
}) => {
  // State for tracking image loading
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  
  // Get feature toggles and settings at component level
  const { features, exposureMaskSettings, circleSizeSettings } = useFeatures();
  const useHSV = features.useHSV;
  const useWeightedDeltaE = features.useWeightedDeltaE;
  const useExposureMasking = features.useExposureMasking;
  const showMaskVisualization = exposureMaskSettings.showMaskVisualization;
  
  // Update circle sizes based on user settings
  useEffect(() => {
    // Apply steeper growth curve for circle sizes, especially for analysis circle
    const calibScale = circleSizeSettings.calibrationCircleScale;
    const analysisScale = circleSizeSettings.analysisCircleScale;
    
    // Apply exponential growth for analysis circle size (steeper curve)
    const analysisScaleFactor = analysisScale < 0.5
      ? analysisScale * 0.8 // Smaller at lower values
      : Math.pow((analysisScale - 0.5) * 2, 1.3) * 0.6 + 0.4; // Steeper growth at higher values
    
    CIRCLE_RADIUS_CALIB = BASE_CIRCLE_RADIUS_CALIB * calibScale;
    CIRCLE_RADIUS_ANALYSIS = BASE_CIRCLE_RADIUS_ANALYSIS * analysisScaleFactor;
    
    // Redraw the canvas when circle sizes change
    if (imageLoaded) {
      drawCanvas();
    }
  }, [circleSizeSettings, imageLoaded]);  // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas for exposure mask visualization
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Calibration circles state (local for drag/removal)
  const [calibCircles, setCalibCircles] = useState<CalibrationCircle[]>([]);
  // Analysis circle state
  const [analysisCircle, setAnalysisCircle] = useState<{ x: number; y: number } | null>(null);
  // Drag state
  const [draggedCircleId, setDraggedCircleId] = useState<number | null>(null);
  const [draggedAnalysis, setDraggedAnalysis] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [cursorStyle, setCursorStyle] = useState<string>('default');
  // State for exposure masking
  const [exposureMask, setExposureMask] = useState<ExposureMask>({
    imageData: null,
    overexposedPercentage: 0,
    underexposedPercentage: 0,
    totalMaskedPercentage: 0,
    width: 0,
    height: 0
  });

  // Sync external calibrationClickPositions with local state
  useEffect(() => {
    if (calibrationMode && calibrationClickPositions) {
      setCalibCircles(
        calibrationClickPositions.map((pos, idx) => ({ x: pos.x, y: pos.y, id: idx + 1 }))
      );
    }
  }, [calibrationClickPositions, calibrationMode]);

  // Load and draw the image
  useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    
    if (!canvas || !maskCanvas) return;
    
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d', { alpha: true });
    
    if (!ctx || !maskCtx) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Set both canvases to image dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
      imageRef.current = img; // Store the image reference
      
      // Only generate mask if feature is enabled
      if (useExposureMasking) {
        // Generate exposure mask after the image is loaded
        setTimeout(() => {
          generateExposureMask();
        }, 100);
      }
    };
    
    img.onerror = () => {
      console.error("Error loading the image.");
    };
    
    img.src = imageUrl;
    
  }, [imageUrl, useExposureMasking]);
  
  // Generate exposure mask for the loaded image
  const generateExposureMask = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !useExposureMasking) return;
    
    // Get values from context, applying the intensity factor
    const maskIntensity = exposureMaskSettings.maskIntensity; // 0.1 (10%) to 1.0 (100%)
    
    // Calculate dynamic thresholds based on intensity
    const baseOverThreshold = exposureMaskSettings.overexposedThreshold;
    const baseUnderThreshold = exposureMaskSettings.underexposedThreshold;
    
    // Dynamic adjustment of thresholds based on intensity
    // As intensity increases from 10% to 100%:
    // - Overexposure threshold decreases (making more pixels count as overexposed)
    // - Underexposure threshold increases (making more pixels count as underexposed)
    // Apply a non-linear curve to make the effect stronger at high intensity values
    // This creates a moderate exponential effect - more sensitive at lower values, stronger but gentler curve at high values
    const intensityFactor = maskIntensity < 0.5 
      ? maskIntensity * 2.5 // More sensitive linear growth from 0-0.5 (was 2.0)
      : Math.pow((maskIntensity - 0.5) * 2, 1.5) * 2.5 + 1.25; // Gentler exponential growth from 0.5-1.0
    
    // At 100% intensity, the effect should be 5x stronger than before
    const adjustmentFactorOver = 225; // 5 times original 45
    const adjustmentFactorUnder = 225; // 5 times original 45
    
    const dynamicOverThreshold = Math.max(baseOverThreshold - (intensityFactor * adjustmentFactorOver / 5), 150); // Lower bound now 150 instead of 200
    const dynamicUnderThreshold = Math.min(baseUnderThreshold + (intensityFactor * adjustmentFactorUnder / 5), 100);  // Upper bound now 100 instead of 70
    
    OVEREXPOSURE_THRESHOLD = dynamicOverThreshold;
    UNDEREXPOSURE_THRESHOLD = dynamicUnderThreshold;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get the current image data from the canvas
    const imageWidth = canvas.width;
    const imageHeight = canvas.height;
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;
    
    // Create a new ImageData for the mask
    const maskData = ctx.createImageData(imageWidth, imageHeight);
    const maskPixels = maskData.data;
    
    // Counters for statistics
    let overexposedCount = 0;
    let underexposedCount = 0;
    const totalPixels = imageWidth * imageHeight;
    
    // Analyze each pixel and create mask
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check if pixel is overexposed (too bright) or underexposed (too dark)
      const isOverexposed = r > OVEREXPOSURE_THRESHOLD && g > OVEREXPOSURE_THRESHOLD && b > OVEREXPOSURE_THRESHOLD;
      const isUnderexposed = r < UNDEREXPOSURE_THRESHOLD && g < UNDEREXPOSURE_THRESHOLD && b < UNDEREXPOSURE_THRESHOLD;
      
      // Calculate alpha value based on mask intensity (0.1 to 1.0)
      // This makes the mask more visible as intensity increases
      const alphaValue = Math.min(100 + Math.round(maskIntensity * 155), 200); // 100 at 10%, up to 200 at 100%
      
      if (isOverexposed) {
        // Mark overexposed pixels with semi-transparent red
        maskPixels[i] = 255;     // R
        maskPixels[i + 1] = 0;   // G
        maskPixels[i + 2] = 0;   // B
        maskPixels[i + 3] = alphaValue; // A (semi-transparent)
        overexposedCount++;
      } else if (isUnderexposed) {
        // Mark underexposed pixels with semi-transparent blue
        maskPixels[i] = 0;       // R
        maskPixels[i + 1] = 0;   // G
        maskPixels[i + 2] = 255; // B
        maskPixels[i + 3] = alphaValue; // A (semi-transparent)
        underexposedCount++;
      } else {
        // Transparent for normal pixels
        maskPixels[i + 3] = 0;
      }
    }
    
    // Calculate percentages
    const overexposedPercentage = (overexposedCount / totalPixels) * 100;
    const underexposedPercentage = (underexposedCount / totalPixels) * 100;
    const totalMaskedPercentage = ((overexposedCount + underexposedCount) / totalPixels) * 100;
    
    // Store the generated mask with statistics
    setExposureMask({
      imageData: maskData,
      overexposedPercentage,
      underexposedPercentage,
      totalMaskedPercentage,
      width: imageWidth,
      height: imageHeight
    });
    
    // Draw the mask if visualization is enabled
    if (showMaskVisualization) {
      drawMaskOverlay(maskData);
    }
    
    console.log(`Mask generated: ${overexposedPercentage.toFixed(1)}% overexposed, ${underexposedPercentage.toFixed(1)}% underexposed`);
  }, [canvasRef, imageRef, useExposureMasking, exposureMaskSettings, showMaskVisualization]);
  
  // Draw the mask overlay on the mask canvas
  const drawMaskOverlay = useCallback((maskData: ImageData) => {
    if (!maskCanvasRef.current) return;
    
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d', { alpha: true });
    if (!maskCtx) return;
    
    // Clear previous mask
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Draw the new mask
    maskCtx.putImageData(maskData, 0, 0);
  }, [maskCanvasRef]);
  
  // Update mask when exposure masking is toggled or settings change
  useEffect(() => {
    if (imageLoaded) {
      if (useExposureMasking) {
        generateExposureMask();
      } else if (maskCanvasRef.current) {
        // Clear the mask if feature is disabled
        const maskCtx = maskCanvasRef.current.getContext('2d');
        if (maskCtx) {
          maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        }
      }
    }
  }, [useExposureMasking, exposureMaskSettings, generateExposureMask, imageLoaded]);
  
  // Draw canvas function - extracted to avoid duplication and improve performance
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw calibration circles
    calibCircles.forEach((circle, idx) => {
      // Blue border
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, CIRCLE_RADIUS_CALIB + 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#1e90ff';
      ctx.lineWidth = 6;
      ctx.stroke();
      // White fill
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, CIRCLE_RADIUS_CALIB, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#1e90ff';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Number (3x bigger)
      ctx.fillStyle = '#1e90ff';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((idx + 1).toString(), circle.x, circle.y);
      // 'X' button (3x bigger, 24px from center)
      ctx.save();
      ctx.beginPath();
      ctx.arc(circle.x + CIRCLE_RADIUS_CALIB + 24, circle.y - CIRCLE_RADIUS_CALIB - 24, 24, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.shadowColor = '#888';
      ctx.shadowBlur = 2;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#1e90ff';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#1e90ff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('×', circle.x + CIRCLE_RADIUS_CALIB + 24, circle.y - CIRCLE_RADIUS_CALIB - 24 + 2);
    });

    // Draw analysis circle
    if (analysisCircle) {
      ctx.beginPath();
      ctx.arc(analysisCircle.x, analysisCircle.y, CIRCLE_RADIUS_ANALYSIS + 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ff6347';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(analysisCircle.x, analysisCircle.y, CIRCLE_RADIUS_ANALYSIS, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
      ctx.strokeStyle = '#ff6347';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }, [imageLoaded, calibCircles, analysisCircle]);

  // Draw canvas whenever relevant state changes
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [drawCanvas, imageLoaded, calibCircles, analysisCircle]);
  
  // --- Mouse event handlers for drag/removal ---
  const getCircleAt = (x: number, y: number) => {
    for (const circle of calibCircles) {
      const dist = Math.hypot(circle.x - x, circle.y - y);
      if (dist <= CIRCLE_RADIUS_CALIB) return circle;
    }
    return null;
  };
  const getCircleXButtonAt = (x: number, y: number) => {
    for (const circle of calibCircles) {
      const bx = circle.x + CIRCLE_RADIUS_CALIB + 24;
      const by = circle.y - CIRCLE_RADIUS_CALIB - 24;
      const dist = Math.hypot(bx - x, by - y);
      if (dist <= 24) return circle;
    }
    return null;
  };
  const isAnalysisCircleAt = (x: number, y: number) => {
    if (!analysisCircle) return false;
    return Math.hypot(analysisCircle.x - x, analysisCircle.y - y) <= CIRCLE_RADIUS_ANALYSIS;
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    // Calibration mode: check for X button or drag
    if (calibrationMode) {
      const xBtn = getCircleXButtonAt(x, y);
      if (xBtn) {
        setCalibCircles(circles => circles.filter(c => c.id !== xBtn.id));
        return;
      }
      const circle = getCircleAt(x, y);
      if (circle) {
        setDraggedCircleId(circle.id);
        setDragOffset({ x: x - circle.x, y: y - circle.y });
        return;
      }
      // Add new calibration circle (max 5)
      if (calibCircles.length < 5) {
        if (onCalibrationClick) {
          onCalibrationClick(x, y);
        } else {
          const newId = calibCircles.length > 0 ? Math.max(...calibCircles.map(c => c.id)) + 1 : 1;
          setCalibCircles([...calibCircles, { x, y, id: newId }]);
        }
      }
      return;
    }
    // Analysis mode: drag or place analysis circle
    if (isAnalysisCircleAt(x, y)) {
      setDraggedAnalysis(true);
      setDragOffset({ x: x - analysisCircle!.x, y: y - analysisCircle!.y });
    } else {
      setAnalysisCircle({ x, y });
      sampleAnalysisCircle({ x, y });
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (calibrationMode && draggedCircleId !== null) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setCalibCircles(circles => circles.map(c => c.id === draggedCircleId ? { ...c, x: x - dragOffset.x, y: y - dragOffset.y } : c));
    }
    if (!calibrationMode && draggedAnalysis) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const scaleX = canvasRef.current!.width / rect.width;
      const scaleY = canvasRef.current!.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setAnalysisCircle({ x: x - dragOffset.x, y: y - dragOffset.y });
      sampleAnalysisCircle({ x: x - dragOffset.x, y: y - dragOffset.y });
    }
  };
  // Mouse Up
  const handleMouseUp = () => {
    setDraggedCircleId(null);
    setDraggedAnalysis(false);
  };

  // --- Sampling Functions ---
  // For calibration: sample mean color inside the circle
  const sampleCalibrationCircles = useCallback(async () => {
    if (!imageLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    for (const circle of calibCircles) {
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (let dx = -CIRCLE_RADIUS_CALIB; dx <= CIRCLE_RADIUS_CALIB; dx++) {
        for (let dy = -CIRCLE_RADIUS_CALIB; dy <= CIRCLE_RADIUS_CALIB; dy++) {
          if (dx * dx + dy * dy <= CIRCLE_RADIUS_CALIB * CIRCLE_RADIUS_CALIB) {
            const px = Math.floor(circle.x + dx);
            const py = Math.floor(circle.y + dy);
            if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
              const pixel = ctx.getImageData(px, py, 1, 1).data;
              totalR += pixel[0]; totalG += pixel[1]; totalB += pixel[2]; count++;
            }
          }
        }
      }
      if (count > 0) {
        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);
        // You can pass this info to parent if needed
      }
    }
  }, [calibCircles, imageLoaded]);

  // For analysis: sample mean color inside the analysis circle
  const sampleAnalysisCircle = useCallback(async (pos: { x: number; y: number }) => {
    if (!imageLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    for (let dx = -CIRCLE_RADIUS_ANALYSIS; dx <= CIRCLE_RADIUS_ANALYSIS; dx++) {
      for (let dy = -CIRCLE_RADIUS_ANALYSIS; dy <= CIRCLE_RADIUS_ANALYSIS; dy++) {
        if (dx * dx + dy * dy <= CIRCLE_RADIUS_ANALYSIS * CIRCLE_RADIUS_ANALYSIS) {
          const px = Math.floor(pos.x + dx);
          const py = Math.floor(pos.y + dy);
          if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
            // Check if exposure masking is enabled and this pixel is masked
            if (useExposureMasking && exposureMask.imageData) {
              const maskCanvas = maskCanvasRef.current;
              if (maskCanvas) {
                const maskCtx = maskCanvas.getContext('2d');
                if (maskCtx) {
                  try {
                    const maskData = maskCtx.getImageData(px, py, 1, 1).data;
                    if (maskData[3] > 0) { // Skip masked pixel (alpha > 0 means it's masked)
                      continue; // Skip this pixel entirely
                    } else {
                      const pixel = ctx.getImageData(px, py, 1, 1).data;
                      totalR += pixel[0]; totalG += pixel[1]; totalB += pixel[2]; count++;
                    }
                  } catch (e) {
                    // Ignore out-of-bounds errors
                  }
                }
              }
            } else {
              const pixel = ctx.getImageData(px, py, 1, 1).data;
              totalR += pixel[0]; totalG += pixel[1]; totalB += pixel[2]; count++;
            }
          }
        }
      }
    }
    if (count > 0) {
      const avgR = Math.round(totalR / count);
      const avgG = Math.round(totalG / count);
      const avgB = Math.round(totalB / count);
      const lab = rgbToLab(avgR, avgG, avgB);
      let adjustedLab = { ...lab };
      if (calibrationLab) {
        const labOffset = {
          L: calibrationLab.officialLab.L - calibrationLab.clickedLab.L,
          a: calibrationLab.officialLab.a - calibrationLab.clickedLab.a,
          b: calibrationLab.officialLab.b - calibrationLab.clickedLab.b
        };
        adjustedLab = {
          L: lab.L + labOffset.L,
          a: lab.a + labOffset.a,
          b: lab.b + labOffset.b
        };
      }
      
      // Pass feature options to shade matcher (using values from component level)
      // Also pass calibration data if available
      const match = await findClosestShade(
        adjustedLab, 
        {
          useHSV,
          useWeightedDeltaE
        },
        // Pass the full calibration object with HSV data when available
        calibration
      );
      
      const pixelData: PixelData = {
        rgb: { r: avgR, g: avgG, b: avgB },
        lab,
        vitaShade: match.shade.name,
        deltaE: match.deltaE,
        deltaHSV: match.deltaHSV,
        position: pos,
        adjustedLab: calibrationLab ? adjustedLab : undefined,
        confidenceScore: match.confidenceScore
      };
      onPixelSelect(pixelData);
    }
  }, [imageLoaded, calibrationLab, onPixelSelect, useHSV, useWeightedDeltaE]);

  // --- Effect: sample when calibration circles change ---
  useEffect(() => {
    if (calibrationMode) sampleCalibrationCircles();
  }, [calibCircles, calibrationMode, sampleCalibrationCircles]);

  // State for tracking canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 600,
    height: 400
  });

  // Update canvas dimensions on window resize
  useEffect(() => {
    const updateCanvasDimensions = () => {
      let width = 600; // Base width
      let height = 400; // Base height
      
      // Responsive scaling for larger screens
      if (window.innerWidth >= 1024) { // lg breakpoint
        width = 700;
        height = 467; // Maintain aspect ratio
      } else if (window.innerWidth >= 768) { // md breakpoint
        width = 650;
        height = 433; // Maintain aspect ratio
      }
      
      setCanvasDimensions({ width, height });
      
      // If image is loaded, redraw canvas with new dimensions
      if (imageLoaded) {
        drawCanvas();
      }
    };

    // Initial update
    updateCanvasDimensions();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateCanvasDimensions);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [imageLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Canvas JSX ---
  return (
    <div className="relative mx-auto max-w-full">
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: calibrationMode
            ? draggedCircleId !== null
              ? 'grabbing'
              : 'crosshair'
            : draggedAnalysis
              ? 'grabbing'
              : 'pointer',
          maxWidth: '100%', 
          width: '100%',
          height: 'auto',
          border: '1px solid #ccc',
          borderRadius: '4px',
          outline: 'none',
          userSelect: 'none',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
      {/* Mask overlay canvas - positioned absolutely on top of the main canvas */}
      <canvas
        ref={maskCanvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          maxWidth: '100%',
          width: '100%',
          height: 'auto',
          pointerEvents: 'none', // Allow clicks to pass through to the main canvas
          opacity: useExposureMasking && showMaskVisualization ? 1 : 0, // Only show when feature is enabled
        }}
      />
    </div>
  );
};

export default ColorAnalysisCanvas;
