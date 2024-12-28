import { create } from 'zustand'

interface TestConfig {
  threshold: number
  plannerPrompt: string
  stepPrompt: string
}

interface TestConfigStore {
  config: TestConfig
  setThreshold: (threshold: number) => void
  setPlannerPrompt: (prompt: string) => void
  setStepPrompt: (prompt: string) => void
}

const defaultConfig: TestConfig = {
  threshold: 0.35,
  plannerPrompt: '',
  stepPrompt: '',
}

export const useTestConfigStore = create<TestConfigStore>((set) => ({
  config: defaultConfig,
  setThreshold: (threshold) =>
    set((state) => ({
      config: { ...state.config, threshold },
    })),
  setPlannerPrompt: (plannerPrompt) =>
    set((state) => ({
      config: { ...state.config, plannerPrompt },
    })),
  setStepPrompt: (stepPrompt) =>
    set((state) => ({
      config: { ...state.config, stepPrompt },
    })),
})) 