import { useTestConfigStore } from '../../stores/use-test-config-store'
import { useWebSocketStore } from '../../stores/use-websocket-store'
import { websocketService } from '../../services/websocket-service'
import { isNil } from '@activepieces/shared';
import { WebsocketEventTypes } from '@activepieces/copilot-shared';
import { cn } from '../../../lib/utils';

export function Scenarios() {
  console.debug('Rendering Scenarios')
  
  const { config } = useTestConfigStore()
  const { state } = useWebSocketStore()
  const socket = websocketService.getSocket()

  function runTest(scenarioTitle: string) {
    socket?.emit(WebsocketEventTypes.RUN_TESTS, {
      scenarioTitle,
      relevanceThreshold: config.threshold,
      customPrompt: config.plannerPrompt.trim() || undefined,
    });
  }

  const isLoading = isNil(state?.scenarios);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={cn('w-[32rem] bg-white border-l border-gray-200 flex flex-col h-full')}>
      <div className="flex-1 p-6">
        <div className="h-full">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Available Scenarios</h2>
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    socket?.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>
              {!socket?.connected && (
                <span className="text-sm text-red-500">
                  Disconnected - Trying to reconnect...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-1/4"
                      >
                        Scenario
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="sticky top-0 right-0 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-40 shadow-l"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {state?.scenarios.map((scenario, index) => {
                      const isRunning = scenario.status === 'running';

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {scenario.title}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {scenario.prompt}
                            </div>
                          </td>
                          <td className="sticky right-0 px-6 py-3 whitespace-nowrap text-right text-sm font-medium bg-white">
                            <div className="relative z-10">
                              {isRunning ? (
                                <button className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 transition-colors text-sm font-medium">
                                  Stop Test
                                </button>
                              ) : (
                                <button
                                  onClick={() => runTest(scenario.title)}
                                  disabled={!socket?.connected}
                                  className={`${
                                    socket?.connected
                                      ? 'bg-blue-600 hover:bg-blue-700'
                                      : 'bg-gray-400 cursor-not-allowed'
                                  } text-white px-4 py-1.5 rounded-md transition-colors text-sm font-medium`}
                                >
                                  Test Scenario
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
