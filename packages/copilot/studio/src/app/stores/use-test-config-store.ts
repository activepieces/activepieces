import { create } from 'zustand'

interface TestConfig {
  systemPrompt: string;
}

interface TestConfigStore {
  config: TestConfig;
  setSystemPrompt: (prompt: string) => void;
}

export const useTestConfigStore = create<TestConfigStore>((set) => ({
  config: {
    systemPrompt: 'You are a helpful assistant.',
  },
  setSystemPrompt: (systemPrompt: string) =>
    set((state) => ({
      config: {
        ...state.config,
        systemPrompt,
      },
    })),
})) 