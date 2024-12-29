import { useTestRegistryStore } from '../../../../stores/use-test-registry-store'
import { useWebSocketStore } from '../../../../stores/use-websocket-store'
import { ModelOutput } from './model-output'
import { websocketService } from '../../../../services/websocket-service'
import { useWorkbenchStore } from '../../../../stores/use-workbench-store'
import { AgentCommand, AgentCommandUpdate } from '@activepieces/copilot-shared'

export function TestScenarios() {
  const { testRegistry } = useTestRegistryStore()
  const { selectedAgentName } = useWorkbenchStore()

  const handleRunTest = async (testIndex: number) => {
    if (!selectedAgentName || !testRegistry) return

    const testCase = testRegistry.testCases[testIndex]
    if (!testCase) return

    console.debug('[TestScenarios] Running test:', testIndex, 'for agent:', selectedAgentName, 'with prompt:', testCase.prompt)
    await websocketService.sendCommand({
      type: AgentCommand.TEST_AGENT,
      command: AgentCommand.TEST_AGENT,
      data: {
        agentName: selectedAgentName,
        prompt: testCase.prompt
      }
    })
  }

  if (!testRegistry) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No test scenarios available. Select an agent to view test scenarios.
      </div>
    )
  }

  if (testRegistry.testCases.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No test scenarios found for agent {testRegistry.agentName}.
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-white">
          <tr>
            <th className="w-12 py-2 px-4 text-left text-sm font-medium text-gray-500 border-b border-gray-200 bg-gray-50">#</th>
            <th className="w-1/4 py-2 px-4 text-left text-sm font-medium text-gray-500 border-b border-gray-200 bg-gray-50">Prompt</th>
            <th className="w-1/3 py-2 px-4 text-left text-sm font-medium text-gray-500 border-b border-gray-200 bg-gray-50">Ideal output</th>
            <th className="w-1/3 py-2 px-4 text-left text-sm font-medium text-gray-500 border-b border-gray-200 bg-gray-50">Model output</th>
            <th className="w-12 py-2 px-4 text-left text-sm font-medium text-gray-500 border-b border-gray-200 bg-gray-50"></th>
          </tr>
        </thead>
        <tbody>
          {testRegistry.testCases.map((testCase, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-4 px-4 text-sm text-gray-900 border-b border-gray-100 align-top">
                {index + 1}
              </td>
              <td className="py-4 px-4 text-sm text-gray-600 border-b border-gray-100 align-top">
                <div className="whitespace-pre-wrap">
                  <div className="font-medium text-gray-900 mb-1">{testCase.title}</div>
                  {testCase.prompt}
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600 border-b border-gray-100 align-top">
                <div className="font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                  {JSON.stringify(testCase.idealOutput, null, 2)}
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600 border-b border-gray-100 align-top">
                <ModelOutput testIndex={index} onRun={() => handleRunTest(index)} />
              </td>
              <td className="py-4 px-4 text-sm text-gray-600 border-b border-gray-100 align-top">
                <button
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 