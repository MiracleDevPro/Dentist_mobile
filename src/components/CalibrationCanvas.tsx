import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';

// Type for calibration circle
interface CalibrationCircle {
  id: number;
  x: number;
  y: number;
  size: number;
  shade?: string;
  lab?: { L: number, a: number, b: number };
  rgb?: { r: number, g: number, b: number };
}

interface CalibrationCanvasProps {
  imageUrl: string;
  circleSize?: number;
  exposureMask?: {
    enabled: boolean;
    value: number; // Threshold percentage
  };
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
  const xn = 95.047;
  const yn = 100.0;
  const zn = 108.883;

  const x1 = x / xn;
  const y1 = y / yn;
  const z1 = z / zn;

  const fx = x1 > 0.008856 ? Math.pow(x1, 1 / 3) : (7.787 * x1) + (16 / 116);
  const fy = y1 > 0.008856 ? Math.pow(y1, 1 / 3) : (7.787 * y1) + (16 / 116);
  const fz = z1 > 0.008856 ? Math.pow(z1, 1 / 3) : (7.787 * z1) + (16 / 116);

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
};

export const CalibrationCanvas: React.FC<CalibrationCanvasProps> = ({
  imageUrl,
  circleSize = 20,
  exposureMask = { enabled: false, value: 50 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const { state, updateCalibrationData } = useWorkflow();
  
  // State for image and circles
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [circles, setCircles] = useState<CalibrationCircle[]>(state.calibrationData.circles || []);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCircleIndex, setDraggedCircleIndex] = useState<number | null>(null);
  const [exposureMaskImageData, setExposureMaskImageData] = useState<ImageData | null>(null);
  
  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImageElement(img);
      
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Generate exposure mask if enabled
          if (exposureMask.enabled) {
            generateExposureMask(ctx, img.width, img.height);
          }
        }
      }
      
      if (overlayRef.current) {
        const overlay = overlayRef.current;
        overlay.width = img.width;
        overlay.height = img.height;
        drawOverlay();
      }
    };
  }, [imageUrl]);
  
  // Update when exposure mask settings change
  useEffect(() => {
    if (!imageElement || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear and redraw image
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imageElement, 0, 0);
    
    // Apply exposure mask if enabled
    if (exposureMask.enabled) {
      generateExposureMask(ctx, canvasRef.current.width, canvasRef.current.height);
    }
    
    // Make sure to update the workflow context
    updateCalibrationData({ 
      exposureMask: exposureMask 
    });
    
  }, [exposureMask.enabled, exposureMask.value, imageElement]);
  
  // Update circles when size changes
  useEffect(() => {
    if (circles.length === 0) return;
    
    const updatedCircles = circles.map(circle => ({
      ...circle,
      size: circleSize
    }));
    
    setCircles(updatedCircles);
    updateCalibrationData({ circles: updatedCircles });
    drawOverlay();
  }, [circleSize]);
  
  // Generate exposure mask
  const generateExposureMask = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const maskData = new Uint8ClampedArray(data);
    
    // Exposure threshold (0-255)
    const threshold = Math.floor((exposureMask.value / 100) * 255);
    
    // Apply mask - highlight properly exposed areas
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance (simplified)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Check if pixel is properly exposed
      if (luminance < threshold * 0.3 || luminance > threshold * 1.7) {
        // Darken and desaturate overexposed/underexposed areas
        maskData[i] = data[i] * 0.5;     // R
        maskData[i + 1] = data[i + 1] * 0.5; // G
        maskData[i + 2] = data[i + 2] * 0.5; // B
        maskData[i + 3] = 255;           // Alpha
      }
    }
    
    // Create mask image data
    const maskImageData = new ImageData(maskData, width, height);
    setExposureMaskImageData(maskImageData);
    
    // Apply mask to canvas
    if (exposureMask.enabled) {
      ctx.putImageData(maskImageData, 0, 0);
    }
  };
  
  // Draw calibration circles on overlay
  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    
    // Clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    
    // Draw circles
    circles.forEach((circle, index) => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw center point
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      // Draw label
      ctx.font = '12px Manrope';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`#${index + 1}`, circle.x, circle.y - circle.size / 2 - 5);
    });
  }, [circles]);
  
  // Handle canvas click to add calibration circle
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if clicked on existing circle (for selection/deletion)
    const clickedCircleIndex = circles.findIndex(circle => {
      const distance = Math.sqrt(Math.pow(circle.x - x, 2) + Math.pow(circle.y - y, 2));
      return distance <= circle.size / 2;
    });
    
    if (clickedCircleIndex !== -1) {
      // If right-click, remove circle
      if (e.button === 2) {
        e.preventDefault();
        const updatedCircles = circles.filter((_, index) => index !== clickedCircleIndex);
        setCircles(updatedCircles);
        updateCalibrationData({ circles: updatedCircles });
        drawOverlay();
      }
      return;
    }
    
    // Limit to 5 calibration circles maximum
    if (circles.length >= 5) {
      const updatedCircles = [...circles.slice(1), createCalibrationCircle(x, y)];
      setCircles(updatedCircles);
      updateCalibrationData({ circles: updatedCircles });
    } else {
      const updatedCircles = [...circles, createCalibrationCircle(x, y)];
      setCircles(updatedCircles);
      updateCalibrationData({ circles: updatedCircles });
    }
    
    drawOverlay();
  };
  
  // Create new calibration circle with color information
  const createCalibrationCircle = (x: number, y: number): CalibrationCircle => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { id: Date.now(), x, y, size: circleSize };
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { id: Date.now(), x, y, size: circleSize };
    }
    
    // Get pixel data at circle position
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    const rgb = { r: pixelData[0], g: pixelData[1], b: pixelData[2] };
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    
    return {
      id: Date.now(),
      x,
      y,
      size: circleSize,
      rgb,
      lab
    };
  };
  
  // Handle circle dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Find circle under cursor
    const index = circles.findIndex(circle => {
      const distance = Math.sqrt(Math.pow(circle.x - x, 2) + Math.pow(circle.y - y, 2));
      return distance <= circle.size / 2;
    });
    
    if (index !== -1) {
      setIsDragging(true);
      setDraggedCircleIndex(index);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || draggedCircleIndex === null || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Update circle position
    const updatedCircles = [...circles];
    updatedCircles[draggedCircleIndex] = {
      ...updatedCircles[draggedCircleIndex],
      x,
      y
    };
    
    setCircles(updatedCircles);
    drawOverlay();
  };
  
  const handleMouseUp = () => {
    if (isDragging && draggedCircleIndex !== null) {
      // Update the workflow context with the final circle positions
      updateCalibrationData({ circles });
      setIsDragging(false);
      setDraggedCircleIndex(null);
    }
  };
  
  // Prevent context menu on right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };
  
  // Calculate canvas container dimensions based on image
  const containerStyle = {
    position: 'relative' as const,
    width: '100%',
    paddingBottom: imageElement ? `${(imageElement.height / imageElement.width) * 100}%` : '75%',
    overflow: 'hidden' as const,
  };
  
  const canvasStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Canvas container with responsive sizing */}
      <div style={containerStyle}>
        {/* Main canvas for image and exposure masking */}
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        />
        
        {/* Overlay canvas for circles */}
        <canvas
          ref={overlayRef}
          style={{
            ...canvasStyle,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      </div>
      
      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Click to add calibration points (max 5). Right-click to remove points.</p>
        {circles.length === 0 && (
          <p className="mt-2 text-amber-600">
            Place calibration points on known shade guide tabs for best results.
          </p>
        )}
      </div>
    </div>
  );
};
