import { create } from 'zustand'
import { prompts } from '../../lib/prompts'
import { formatPlannerPromptTemplate } from '@activepieces/copilot-shared'

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

export const useTestConfigStore = create<TestConfigStore>((set) => ({
  config: {
    threshold: 0.7,
    plannerPrompt: formatPlannerPromptTemplate(prompts.planner.default),
    stepPrompt: '',
  },
  setThreshold: (threshold: number) =>
    set((state) => ({
      config: {
        ...state.config,
        threshold,
      },
    })),
  setPlannerPrompt: (plannerPrompt: string) =>
    set((state) => ({
      config: {
        ...state.config,
        plannerPrompt,
      },
    })),
  setStepPrompt: (stepPrompt: string) =>
    set((state) => ({
      config: {
        ...state.config,
        stepPrompt,
      },
    })),
})) 