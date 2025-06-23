import React, { createContext, useState, useContext, ReactNode } from 'react';

interface FeatureFlags {
  aiMasterToggle: boolean;
  useHSV: boolean;
  useWeightedDeltaE: boolean;
  useAverageAnalysis: boolean;
  useLightCorrection: boolean;
  useFuzzyLogic: boolean;
  useML: boolean; // For future ML enhancement
  useExposureMasking: boolean; // Mask overexposed/underexposed areas
  useClinicalSuggestions: boolean; // Provide layered shade suggestions
}

interface ExposureMaskSettings {
  showMaskVisualization: boolean; // Whether to show the mask overlay
  overexposedThreshold: number; // RGB threshold for overexposure (default: 245)
  underexposedThreshold: number; // RGB threshold for underexposure (default: 25)
  maskIntensity: number; // Controls mask coverage intensity from 0.1 (10%) to 1.0 (100%)
}

interface CircleSizeSettings {
  calibrationCircleScale: number; // Scale factor for calibration circles (0.2 to 5.0)
  analysisCircleScale: number; // Scale factor for analysis circle (0.2 to 5.0)
}

interface FeaturesContextType {
  features: FeatureFlags;
  toggleFeature: (feature: keyof FeatureFlags) => void;
  isFeatureEnabled: (feature: keyof Omit<FeatureFlags, 'aiMasterToggle'>) => boolean;
  
  // Exposure mask settings
  exposureMaskSettings: ExposureMaskSettings;
  updateExposureMaskSettings: (settings: Partial<ExposureMaskSettings>) => void;
  
  // Circle size settings
  circleSizeSettings: CircleSizeSettings;
  updateCircleSizeSettings: (settings: Partial<CircleSizeSettings>) => void;
}

const defaultFeatures: FeatureFlags = {
  aiMasterToggle: false,
  useHSV: false,
  useWeightedDeltaE: false,
  useAverageAnalysis: false,
  useLightCorrection: false,
  useFuzzyLogic: false,
  useML: false,
  useExposureMasking: false, // OFF by default
  useClinicalSuggestions: false // OFF by default
};

const defaultExposureMaskSettings: ExposureMaskSettings = {
  showMaskVisualization: true, // Show the mask when the feature is enabled
  overexposedThreshold: 245,
  underexposedThreshold: 25,
  maskIntensity: 0.1, // Start at 10% intensity by default
};

const defaultCircleSizeSettings: CircleSizeSettings = {
  calibrationCircleScale: 1.0, // 100% - default size
  analysisCircleScale: 1.0,    // 100% - default size
};

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export const FeaturesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  const [exposureMaskSettings, setExposureMaskSettings] = useState<ExposureMaskSettings>(defaultExposureMaskSettings);
  const [circleSizeSettings, setCircleSizeSettings] = useState<CircleSizeSettings>(defaultCircleSizeSettings);

  // Update master toggle based on individual features
  React.useEffect(() => {
    // Check if all AI features are enabled
    const allFeaturesOn = 
      features.useHSV && 
      features.useWeightedDeltaE && 
      features.useAverageAnalysis && 
      features.useLightCorrection && 
      features.useFuzzyLogic && 
      features.useML &&
      features.useExposureMasking &&
      features.useClinicalSuggestions;
    
    // Check if all AI features are disabled
    const allFeaturesOff = 
      !features.useHSV && 
      !features.useWeightedDeltaE && 
      !features.useAverageAnalysis && 
      !features.useLightCorrection && 
      !features.useFuzzyLogic && 
      !features.useML &&
      !features.useExposureMasking &&
      !features.useClinicalSuggestions;
    
    // Update master toggle to reflect feature states
    if (allFeaturesOn && !features.aiMasterToggle) {
      setFeatures(prev => ({ ...prev, aiMasterToggle: true }));
    } else if (allFeaturesOff && features.aiMasterToggle) {
      setFeatures(prev => ({ ...prev, aiMasterToggle: false }));
    }
  }, [
    features.useHSV, 
    features.useWeightedDeltaE,
    features.useAverageAnalysis,
    features.useLightCorrection,
    features.useFuzzyLogic,
    features.useML,
    features.useExposureMasking,
    features.useClinicalSuggestions,
    features.aiMasterToggle
  ]);

  const toggleFeature = (feature: keyof FeatureFlags) => {
    setFeatures(prevFeatures => {
      // Special logic for the master toggle - now works as a convenience toggle for all features
      if (feature === 'aiMasterToggle') {
        const newMasterState = !prevFeatures.aiMasterToggle;
        return {
          ...prevFeatures,
          aiMasterToggle: newMasterState,
          // Turn all features on or off together with master toggle
          useHSV: newMasterState,
          useWeightedDeltaE: newMasterState,
          useAverageAnalysis: newMasterState,
          useLightCorrection: newMasterState,
          useFuzzyLogic: newMasterState,
          useML: newMasterState,
          useExposureMasking: newMasterState,
          useClinicalSuggestions: newMasterState,
        };
      } else {
        // For individual features, just toggle their state independently
        return {
          ...prevFeatures,
          [feature]: !prevFeatures[feature],
        };
      }
    });
  };

  // Now each feature is independently enabled regardless of master toggle
  const isFeatureEnabled = (feature: keyof Omit<FeatureFlags, 'aiMasterToggle'>) => {
    return features[feature];
  };

  // Update exposure mask settings
  const updateExposureMaskSettings = (settings: Partial<ExposureMaskSettings>) => {
    setExposureMaskSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  // Update circle size settings
  const updateCircleSizeSettings = (settings: Partial<CircleSizeSettings>) => {
    setCircleSizeSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  return (
    <FeaturesContext.Provider value={{
      features,
      toggleFeature,
      isFeatureEnabled,
      exposureMaskSettings,
      updateExposureMaskSettings,
      circleSizeSettings,
      updateCircleSizeSettings
    }}>
      {children}
    </FeaturesContext.Provider>
  );
};

export const useFeatures = (): FeaturesContextType => {
  const context = useContext(FeaturesContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context;
};
