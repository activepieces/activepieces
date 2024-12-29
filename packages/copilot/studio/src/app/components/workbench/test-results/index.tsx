import { useWebSocketStore } from '../../../stores/use-websocket-store'
import { websocketService } from '../../../services/websocket-service'
import {
  WebsocketCopilotResult,
  PieceCommandUpdate,
  TestCommandUpdate,
  AgentCommandUpdate,
  SystemUpdate,
} from '@activepieces/copilot-shared';
import {
  PiecesFound,
  TestError,
} from './components';
import { cn } from '../../../../lib/utils';

export function TestResults() {
  console.debug('Rendering TestResults')
  
  const { results, clearResults } = useWebSocketStore()
  const socket = websocketService.getSocket()

  const renderStepContent = (result: WebsocketCopilotResult) => {
    switch (result.type) {
      case PieceCommandUpdate.PIECES_FOUND:
        return <PiecesFound data={result.data} />;

      case TestCommandUpdate.TEST_ERROR:
        return <TestError data={result.data} />;

      case SystemUpdate.ERROR: {
        const message = result.data?.message;
        if (message) {
          return <div className="text-sm text-gray-600">{message}</div>;
        }
        return null;
      }

      default: {
        const message = result.data?.message;
        if (message) {
          return <div className="text-sm text-gray-600">{message}</div>;
        }
        return null;
      }
    }
  };

  const getStatusColor = (type: WebsocketCopilotResult['type']) => {
    if (type === TestCommandUpdate.TEST_ERROR || type === SystemUpdate.ERROR) return 'text-red-600';
    if (type === PieceCommandUpdate.PIECES_FOUND) return 'text-purple-600';
    return 'text-gray-900';
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
                        <span className={`font-medium text-sm ${getStatusColor(result.type)}`}>
                          {result.type
                            .split('_')
                            .map(
                              (word: string) =>
                                word.charAt(0) + word.slice(1).toLowerCase()
                            )
                            .join(' ')}
                        </span>

                        {(result.data?.scenarioTitle ||
                          result.data?.title) && (
                          <div className="text-xs text-gray-600 mt-1">
                            Scenario:{' '}
                            {result.data?.scenarioTitle ||
                              result.data?.title}
                          </div>
                        )}
                      </div>
                    </div>
                    {renderStepContent(result)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
