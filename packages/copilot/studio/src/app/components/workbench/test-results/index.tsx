import { useWebSocketStore } from '../../../stores/use-websocket-store'
import { websocketService } from '../../../services/websocket-service'
import { AgentCommandUpdate } from '@activepieces/copilot-shared'
import { TestScenarios } from './components/test-scenarios';
import { cn } from '../../../../lib/utils';
import { useEffect } from 'react'
import { useTestRegistryStore } from '../../../stores/use-test-registry-store'
import { useWorkbenchStore } from '../../../stores/use-workbench-store'

export function TestResults() {  
  const { results, clearResults } = useWebSocketStore()
  const socket = websocketService.getSocket()
  const { clearTestRegistry } = useTestRegistryStore()
  const { selectedAgentName } = useWorkbenchStore()

  // Request test registry when selected agent changes
  useEffect(() => {
    if (selectedAgentName) {
      console.debug('[TestResults] Requesting test registry for agent:', selectedAgentName)
      websocketService.getTestRegistry(selectedAgentName)
    }
  }, [selectedAgentName])

  // Request test registry when agent test starts
  useEffect(() => {
    const latestResult = results[results.length - 1]
    if (latestResult?.type === AgentCommandUpdate.AGENT_TEST_STARTED) {
      const agentName = latestResult.data?.agentName
      if (agentName) {
        console.debug('[TestResults] Agent test started, requesting test registry for:', agentName)
        websocketService.getTestRegistry(agentName)
      }
    }
  }, [results])

  useEffect(() => {
    return () => {
      clearTestRegistry()
    }
  }, [])

  return (
    <div className={cn('flex-1 bg-gray-100 overflow-hidden')}>
      <div className="h-full p-4">
        <div className="bg-white rounded-md h-full overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-none px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Test Results {selectedAgentName ? `- ${selectedAgentName}` : ''}
                  </h2>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      socket?.connected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearResults}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-md transition-colors duration-200"
                  >
                    Clear Results
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="h-full">
                <TestScenarios />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
