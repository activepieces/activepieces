import { createContext, useContext, useState, ReactNode } from 'react';

interface TestConfig {
  threshold: number;
  plannerPrompt: string;
  stepPrompt: string;
}

interface TestConfigContextType {
  config: TestConfig;
  setThreshold: (threshold: number) => void;
  setPlannerPrompt: (prompt: string) => void;
  setStepPrompt: (prompt: string) => void;
}

const defaultConfig: TestConfig = {
  threshold: 0.35,
  plannerPrompt: '',
  stepPrompt: '',
};

const TestConfigContext = createContext<TestConfigContextType | undefined>(undefined);

export function TestConfigProvider({ children }: { children: ReactNode }) {
  console.debug('Rendering TestConfigProvider');

  const [config, setConfig] = useState<TestConfig>(defaultConfig);

  const setThreshold = (threshold: number) => {
    setConfig(prev => ({ ...prev, threshold }));
  };

  const setPlannerPrompt = (plannerPrompt: string) => {
    setConfig(prev => ({ ...prev, plannerPrompt }));
  };

  const setStepPrompt = (stepPrompt: string) => {
    setConfig(prev => ({ ...prev, stepPrompt }));
  };

  return (
    <TestConfigContext.Provider value={{ config, setThreshold, setPlannerPrompt, setStepPrompt }}>
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