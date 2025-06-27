import React, { createContext, useContext, useState, ReactNode } from 'react';

export type WorkflowPhase = 'upload' | 'calibration' | 'analysis' | 'results';

export interface CalibrationState {
  isCompleted: boolean;
  skipped: boolean;
  circles: Array<{
    x: number;
    y: number;
    size: number;
    vitaShade?: string;
    labValues?: { L: number; a: number; b: number };
  }>;
  exposureMask: {
    enabled: boolean;
    value: number;
  };
}

export interface AnalysisState {
  currentPixelData: any;
  analysisPoints: Array<{
    x: number;
    y: number;
    vitaShade: string;
    confidence: number;
    timestamp: number;
  }>;
  exposureMask: {
    enabled: boolean;
    value: number;
  };
}

export interface WorkflowState {
  currentPhase: WorkflowPhase;
  calibrationData: CalibrationState;
  analysisData: AnalysisState;
  canGoBack: boolean;
  canProceed: boolean;
  uploadedImage: File | null;
  processedImage: File | null;
}

interface WorkflowContextType {
  state: WorkflowState;
  setPhase: (phase: WorkflowPhase) => void;
  setUploadedImage: (file: File | null) => void;
  updateCalibrationData: (data: Partial<CalibrationState>) => void;
  updateAnalysisData: (data: Partial<AnalysisState>) => void;
  goToNextPhase: () => void;
  goToPreviousPhase: () => void;
  resetWorkflow: () => void;
  setProcessedImage: (file: File | null) => void;
}

const initialCalibrationState: CalibrationState = {
  isCompleted: false,
  skipped: false,
  circles: [],
  exposureMask: {
    enabled: false,
    value: 0,
  },
};

const initialAnalysisState: AnalysisState = {
  currentPixelData: null,
  analysisPoints: [],
  exposureMask: {
    enabled: false,
    value: 0,
  },
};

const initialState: WorkflowState = {
  currentPhase: 'upload', // <-- Set to 'upload' to start at the upload step
  calibrationData: initialCalibrationState,
  analysisData: initialAnalysisState,
  canGoBack: false,
  canProceed: false,
  uploadedImage: null,
  processedImage: null
};

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

interface WorkflowProviderProps {
  children: ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [state, setState] = useState<WorkflowState>(initialState);

  const setPhase = (phase: WorkflowPhase) => {
    setState(prev => ({
      ...prev,
      currentPhase: phase,
      canGoBack: phase !== 'upload',
      canProceed: validatePhaseCompletion(phase, prev),
    }));
  };

  const setUploadedImage = (file: File | null) => {
    setState(prev => ({
      ...prev,
      uploadedImage: file,
      canProceed: file !== null,
    }));
  };

  const setProcessedImage = (file: File | null) => {
    setState(prev => ({
      ...prev,
      processedImage: file,
      canProceed: file !== null,
    }));
  };

  const updateCalibrationData = (data: Partial<CalibrationState>) => {
    setState(prev => ({
      ...prev,
      calibrationData: { ...prev.calibrationData, ...data },
    }));
  };

  const updateAnalysisData = (data: Partial<AnalysisState>) => {
    setState(prev => ({
      ...prev,
      analysisData: { ...prev.analysisData, ...data },
    }));
  };

  const goToNextPhase = () => {
    const phaseOrder: WorkflowPhase[] = ['upload', 'calibration', 'analysis', 'results'];
    const currentIndex = phaseOrder.indexOf(state.currentPhase);
    if (currentIndex < phaseOrder.length - 1) {
      setPhase(phaseOrder[currentIndex + 1]);
    }
  };

  const goToPreviousPhase = () => {
    const phaseOrder: WorkflowPhase[] = ['upload', 'calibration', 'analysis', 'results'];
    const currentIndex = phaseOrder.indexOf(state.currentPhase);
    if (currentIndex > 0) {
      setPhase(phaseOrder[currentIndex - 1]);
    }
  };

  const resetWorkflow = () => {
    setState(initialState);
  };

  const validatePhaseCompletion = (phase: WorkflowPhase, currentState: WorkflowState): boolean => {
    switch (phase) {
      case 'upload':
        return currentState.uploadedImage !== null;
      case 'calibration':
        return currentState.calibrationData.isCompleted || currentState.calibrationData.skipped;
      case 'analysis':
        return currentState.analysisData.analysisPoints.length > 0;
      case 'results':
        return true;
      default:
        return false;
    }
  };

  return (
    <WorkflowContext.Provider
      value={{
        state,
        setPhase,
        setUploadedImage,
        updateCalibrationData,
        updateAnalysisData,
        goToNextPhase,
        goToPreviousPhase,
        setProcessedImage, 
        resetWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
