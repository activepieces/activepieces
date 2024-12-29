import { useWebSocketStore } from '../../../stores/use-websocket-store'
import { websocketService } from '../../../services/websocket-service'
import { AgentCommandUpdate } from '@activepieces/copilot-shared'
import { TestScenarios } from './components/test-scenarios';
import { cn } from '../../../../lib/utils';
import { useEffect } from 'react'
import { useTestRegistryStore } from '../../../stores/use-test-registry-store'

export function TestResults() {
  console.debug('Rendering TestResults')
  
  const { results, clearResults } = useWebSocketStore()
  const socket = websocketService.getSocket()
  const { clearTestRegistry } = useTestRegistryStore()

  useEffect(() => {
    const latestResult = results[results.length - 1]
    if (latestResult?.type === AgentCommandUpdate.AGENT_TEST_STARTED) {
      const agentName = latestResult.data?.agentName
      if (agentName) {
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
                    Test Results
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
              <div className="h-full flex divide-x divide-gray-100">
                {/* Test Scenarios Panel */}
                <div className="w-96 overflow-y-auto min-h-0 px-6 py-4">
                  <TestScenarios />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
