import basicTestCases from './test-cases/basic.json'

interface TestCase {
  title: string
  prompt: string
  idealOutput: Record<string, any>
}

interface TestRegistry {
  agentName: string
  testCases: TestCase[]
}

// Add more test case files here as needed
const TEST_REGISTRIES: TestRegistry[] = [
  basicTestCases,
]

// In-memory storage for test registries
const registriesMap = new Map<string, TestRegistry>()

export const initializeTestRegistry = () => {
  // Load all test registries into memory
  TEST_REGISTRIES.forEach(registry => {
    registriesMap.set(registry.agentName, registry)
  })
}

export const getTestRegistry = (agentName: string): TestRegistry | undefined => {
  return registriesMap.get(agentName)
}

export const addTestRegistry = (registry: TestRegistry) => {
  registriesMap.set(registry.agentName, registry)
}

export const getAllTestRegistries = (): TestRegistry[] => {
  return Array.from(registriesMap.values())
} 