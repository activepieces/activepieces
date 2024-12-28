import { useWebSocketStore } from '../../../stores/use-websocket-store'
import { websocketService } from '../../../services/websocket-service'
import {
  WebsocketCopilotResult,
  WebsocketCopilotUpdate,
} from '@activepieces/copilot-shared';
import {
  PiecesFound,
  PlanGenerated,
  StepCreated,
  ScenarioCompleted,
  TestError,
  ActiveScenarioCard,
} from './components';
import { cn } from '../../../../lib/utils';

export function TestResults() {
  console.debug('Rendering TestResults')
  
  const { results, clearResults } = useWebSocketStore()
  const socket = websocketService.getSocket()

  const renderStepContent = (result: WebsocketCopilotResult) => {
    switch (result.type) {
      case WebsocketCopilotUpdate.PIECES_FOUND:
        return <PiecesFound data={result.data} />;

      case WebsocketCopilotUpdate.PLAN_GENERATED:
        return <PlanGenerated data={result.data} />;

      case WebsocketCopilotUpdate.STEP_CREATED:
        return <StepCreated data={result.data} />;

      case WebsocketCopilotUpdate.SCENARIO_COMPLETED:
        return <ScenarioCompleted data={result.data} />;

      case WebsocketCopilotUpdate.TEST_ERROR:
        return <TestError data={result.data} />;

      case WebsocketCopilotUpdate.TEST_STATE:
        return <ActiveScenarioCard data={result.data} />;

      default: {
        const message = (result as { data: { message?: string } }).data.message;
        if (message) {
          return <div className="text-sm text-gray-600">{message}</div>;
        }
        return null;
      }
    }
  };

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

            <div className="flex-1 overflow-y-auto min-h-0 px-6">
              <div className="space-y-3 py-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg shadow-sm ring-1 ring-gray-200 border-gray-100 p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span
                          className={`font-medium text-sm ${
                            result.type === WebsocketCopilotUpdate.TEST_ERROR
                              ? 'text-red-600'
                              : result.type ===
                                WebsocketCopilotUpdate.SCENARIO_COMPLETED
                              ? 'text-green-600'
                              : result.type ===
                                WebsocketCopilotUpdate.PIECES_FOUND
                              ? 'text-purple-600'
                              : result.type ===
                                WebsocketCopilotUpdate.PLAN_GENERATED
                              ? 'text-blue-600'
                              : result.type ===
                                WebsocketCopilotUpdate.STEP_CREATED
                              ? 'text-indigo-600'
                              : result.type ===
                                WebsocketCopilotUpdate.TEST_STATE
                              ? 'text-blue-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {result.type
                            .split('_')
                            .map(
                              (word: string) =>
                                word.charAt(0) + word.slice(1).toLowerCase()
                            )
                            .join(' ')}
                        </span>

                        {((result.data as any).scenarioTitle ||
                          (result.data as any).title) && (
                          <div className="text-xs text-gray-600 mt-1">
                            Scenario:{' '}
                            {(result.data as any).scenarioTitle ||
                              (result.data as any).title}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
                        {new Date(
                          (result.data as any).timestamp
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      {renderStepContent(result)}
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <div className="text-center text-gray-600 py-12">
                    <p className="text-sm">No test results yet.</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Run a scenario to see results here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
