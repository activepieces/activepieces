import { create } from 'zustand'

interface TestCase {
  title: string
  prompt: string
  idealOutput: Record<string, any>
}

interface TestRegistry {
  agentName: string
  testCases: TestCase[]
}

interface TestRegistryStore {
  testRegistry: TestRegistry | null
  setTestRegistry: (registry: TestRegistry) => void
  clearTestRegistry: () => void
}

export const useTestRegistryStore = create<TestRegistryStore>((set) => ({
  testRegistry: null,
  setTestRegistry: (registry) => set({ testRegistry: registry }),
  clearTestRegistry: () => set({ testRegistry: null }),
})) 