import { useTestRegistryStore } from '../../../../stores/use-test-registry-store'

export function TestScenarios() {
  const { testRegistry } = useTestRegistryStore()

  if (!testRegistry) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700">Test Scenarios</div>
      <div className="space-y-3">
        {testRegistry.testCases.map((testCase, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 p-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  {testCase.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{testCase.prompt}</p>
              <div className="text-xs text-gray-500">
                <div className="font-medium">Expected Output:</div>
                <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                  {JSON.stringify(testCase.idealOutput, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 