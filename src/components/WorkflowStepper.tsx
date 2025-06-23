import React from 'react';
import { useWorkflow, WorkflowPhase } from '@/contexts/WorkflowContext';
import { cn } from '@/lib/utils';

// SVG components for each step
const Step1Icon = () => <img src="/images/Step1.svg" alt="Upload" className="w-5 h-5" />;
const Step2Icon = () => <img src="/images/Step2.svg" alt="Calibrate" className="w-5 h-5" />;
const Step3Icon = () => <img src="/images/Step3.svg" alt="Analysis" className="w-5 h-5" />;
const Step4Icon = () => <img src="/images/Step4.svg" alt="Report" className="w-5 h-5" />;

interface WorkflowStepperProps {
  currentPhase?: WorkflowPhase;
  completedPhases?: WorkflowPhase[];
  className?: string;
}

const steps = [
  {
    id: 'upload' as WorkflowPhase,
    title: 'Upload',
    icon: Step1Icon,
    description: 'Upload dental image',
  },
  {
    id: 'calibration' as WorkflowPhase,
    title: 'Calibrate',
    icon: Step2Icon,
    description: 'Set reference points',
  },
  {
    id: 'analysis' as WorkflowPhase,
    title: 'Analysis',
    icon: Step3Icon,
    description: 'Color analysis',
  },
  {
    id: 'results' as WorkflowPhase,
    title: 'Report',
    icon: Step4Icon,
    description: 'View report',
  },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentPhase: propCurrentPhase,
  completedPhases: propCompletedPhases,
  className = '',
}) => {
  const { state } = useWorkflow();
  
  // Use props if provided, otherwise use context
  const currentPhase = propCurrentPhase || state.currentPhase;
  
  // Since completedPhases is not in our context, calculate it
  const completedPhases = propCompletedPhases || (() => {
    // Default logic: all phases before current one are completed
    const currentIndex = steps.findIndex(step => step.id === state.currentPhase);
    return steps
      .filter((_, index) => index < currentIndex)
      .map(step => step.id);
  })();
  const getStepStatus = (stepId: WorkflowPhase) => {
    if (completedPhases.includes(stepId)) return 'completed';
    if (stepId === currentPhase) return 'current';
    return 'upcoming';
  };

  return (
    <div className={`w-full py-1 ${className} max-w-screen-lg mx-auto`}>
      {/* Unified Icons Navigation (for all screen sizes) */}
      <div className="flex justify-around items-center w-full max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`
                  transition-all duration-200 
                  ${status === 'current' ? 'opacity-100 scale-106' : 'opacity-40'}
                `}
              >
                <Icon />
              </div>
              <span 
                className={`
                  text-xs mt-1 font-light 
                  ${status === 'current' ? 'text-gray-700' : 'text-gray-400'}
                `}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
