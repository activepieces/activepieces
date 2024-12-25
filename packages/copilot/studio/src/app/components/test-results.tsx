import { useWebSocket } from '../WebSocketContext';
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
} from './test-results/components';

export const TestResults: React.FC = () => {
  const { socket, results } = useWebSocket();

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

      default:
        if ('message' in result.data && result.data.message) {
          return (
            <div className="text-sm text-gray-600">{result.data.message}</div>
          );
        }
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                socket?.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="flex items-center gap-2"></div>
        </div>
      </div>

      <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-0">
        <div className="space-y-2 pb-2">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 rounded shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`font-medium text-sm ${
                      result.type === WebsocketCopilotUpdate.TEST_ERROR
                        ? 'text-red-600'
                        : result.type === WebsocketCopilotUpdate.SCENARIO_COMPLETED
                        ? 'text-green-600'
                        : result.type === WebsocketCopilotUpdate.PIECES_FOUND
                        ? 'text-purple-600'
                        : result.type === WebsocketCopilotUpdate.PLAN_GENERATED
                        ? 'text-blue-600'
                        : result.type === WebsocketCopilotUpdate.STEP_CREATED
                        ? 'text-indigo-600'
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
                    <div className="text-xs text-gray-600 mt-0.5">
                      Scenario:{' '}
                      {(result.data as any).scenarioTitle ||
                        (result.data as any).title}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date((result.data as any).timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="overflow-x-auto">{renderStepContent(result)}</div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-sm">
              No test results yet. Run a scenario to see results here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
