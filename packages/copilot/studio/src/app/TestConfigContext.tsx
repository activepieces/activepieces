import { createContext, useContext, useState, ReactNode } from 'react';

type PlanStep = {
  type: 'PIECE_TRIGGER' | 'PIECE' | 'ROUTER';
  description: string;
  required: boolean;
};

type StepConfig = {
  steps: PlanStep[];
};

interface TestConfig {
  threshold: number;
  customPrompt: string;
  stepConfig: StepConfig;
}

interface TestConfigContextType {
  config: TestConfig;
  setThreshold: (threshold: number) => void;
  setCustomPrompt: (prompt: string) => void;
  setStepConfig: (config: StepConfig) => void;
}

const defaultConfig: TestConfig = {
  threshold: 0.35,
  customPrompt: '',
  stepConfig: {
    steps: [
      {
        type: 'PIECE_TRIGGER',
        description: 'Start with a trigger step',
        required: true
      },
      {
        type: 'PIECE',
        description: 'Include necessary action steps',
        required: false
      }
    ]
  }
};

const TestConfigContext = createContext<TestConfigContextType | undefined>(undefined);

export function TestConfigProvider({ children }: { children: ReactNode }) {
  console.debug('Rendering TestConfigProvider');

  const [config, setConfig] = useState<TestConfig>(defaultConfig);

  const setThreshold = (threshold: number) => {
    setConfig(prev => ({ ...prev, threshold }));
  };

  const setCustomPrompt = (customPrompt: string) => {
    setConfig(prev => ({ ...prev, customPrompt }));
  };

  const setStepConfig = (stepConfig: StepConfig) => {
    setConfig(prev => ({ ...prev, stepConfig }));
  };

  return (
    <TestConfigContext.Provider value={{ config, setThreshold, setCustomPrompt, setStepConfig }}>
      {children}
    </TestConfigContext.Provider>
  );
}

export function useTestConfig() {
  const context = useContext(TestConfigContext);
  if (context === undefined) {
    throw new Error('useTestConfig must be used within a TestConfigProvider');
  }
  return context;
} 