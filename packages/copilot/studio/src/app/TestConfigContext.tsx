import { createContext, useContext, useState, ReactNode } from 'react';

interface TestConfig {
  threshold: number;
  customPrompt: string;
}

interface TestConfigContextType {
  config: TestConfig;
  setThreshold: (threshold: number) => void;
  setCustomPrompt: (prompt: string) => void;
}

const defaultConfig: TestConfig = {
  threshold: 0.35,
  customPrompt: '',
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

  return (
    <TestConfigContext.Provider value={{ config, setThreshold, setCustomPrompt }}>
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