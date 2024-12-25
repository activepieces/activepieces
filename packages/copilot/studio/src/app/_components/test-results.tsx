import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../WebSocketContext';
import { 
  TestResult, 
  TestResultType,
  PiecesFoundData,
  PlanGeneratedData,
  StepCreatedData,
  ScenarioCompletedData,
  TestErrorData,
  TestStateData
} from '@activepieces/copilot-shared';

function isPiecesFoundData(data: any): data is PiecesFoundData {
  return 'relevantPieces' in data;
}

function isPlanGeneratedData(data: any): data is PlanGeneratedData {
  return 'plan' in data;
}

function isStepCreatedData(data: any): data is StepCreatedData {
  return 'step' in data;
}

function isScenarioCompletedData(data: any): data is ScenarioCompletedData {
  return 'output' in data;
}

function isTestErrorData(data: any): data is TestErrorData {
  return 'error' in data;
}

function isTestStateData(data: any): data is TestStateData {
  return 'isRunning' in data;
}

export const TestResults: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const { ws, isConnected } = useWebSocket();

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const result = JSON.parse(event.data) as TestResult;
      console.debug('Test Results received:', result);

      // Handle all relevant test messages
      if (
        result.type === TestResultType.TEST_ERROR ||
        result.type === TestResultType.TEST_STOPPED ||
        result.type === TestResultType.SCENARIO_COMPLETED ||
        result.type === TestResultType.TEST_SUMMARY ||
        result.type === TestResultType.STEP_CREATED ||
        result.type === TestResultType.PLAN_GENERATED ||
        result.type === TestResultType.PIECES_FOUND ||
        (result.type === TestResultType.TEST_STATE && isTestStateData(result.data) && result.data.isRunning)
      ) {
        setResults(prev => [...prev, result]);
      }
    } catch (err) {
      console.error('Error parsing test result:', err);
    }
  }, []);

  useEffect(() => {
    if (!ws) return;

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, handleMessage]);

  const clearResults = () => {
    setResults([]);
  };

  const renderStepContent = (result: TestResult) => {
    switch (result.type) {
      case TestResultType.PIECES_FOUND:
        if (!isPiecesFoundData(result.data)) return null;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Found Relevant Pieces:</div>
            <div className="grid gap-2">
              {result.data.relevantPieces.map((piece: { pieceName: string; content: string }, i: number) => (
                <div key={i} className="bg-white p-2 rounded border border-gray-200 text-xs">
                  <div className="font-medium">{piece.pieceName}</div>
                  <div className="text-gray-600 mt-1">{piece.content}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case TestResultType.PLAN_GENERATED:
        if (!isPlanGeneratedData(result.data)) return null;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Generated Plan:</div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-medium text-sm">{result.data.plan.name}</div>
              <div className="text-xs text-gray-600 mt-1">{result.data.plan.description}</div>
              <div className="mt-2 space-y-2">
                {result.data.plan.steps.map((step: { type: string; pieceName: string; actionOrTriggerName?: string; condition?: string }, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="bg-blue-100 text-blue-800 px-1.5 rounded">{i + 1}</div>
                    <div>
                      <span className="font-medium">{step.type}</span>
                      <span className="text-gray-600"> using </span>
                      <span className="font-medium">{step.pieceName}</span>
                      {step.actionOrTriggerName && (
                        <span className="text-gray-600"> ({step.actionOrTriggerName})</span>
                      )}
                      {step.condition && (
                        <div className="text-gray-600 mt-0.5">
                          Condition: {step.condition}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case TestResultType.STEP_CREATED:
        if (!isStepCreatedData(result.data)) return null;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Created Step:</div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-medium text-sm">{result.data.step.name}</div>
              <div className="text-xs mt-1">
                <span className="text-gray-600">Type: </span>
                <span className="font-medium">{result.data.step.type}</span>
              </div>
              {result.data.step.piece && (
                <div className="text-xs mt-1">
                  <span className="text-gray-600">Piece: </span>
                  <span className="font-medium">{result.data.step.piece.pieceName}</span>
                  {(result.data.step.piece.actionName || result.data.step.piece.triggerName) && (
                    <span className="text-gray-600">
                      {' '}({result.data.step.piece.actionName || result.data.step.piece.triggerName})
                    </span>
                  )}
                </div>
              )}
              {result.data.step.input && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Input Configuration:</div>
                  <pre className="text-xs bg-gray-50 p-1.5 rounded">
                    {JSON.stringify(result.data.step.input, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );

      case TestResultType.SCENARIO_COMPLETED:
        if (!isScenarioCompletedData(result.data)) return null;
        return (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Final Output:</div>
            <pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">
              {JSON.stringify(result.data.output, null, 2)}
            </pre>
          </div>
        );

      case TestResultType.TEST_ERROR:
        if (!isTestErrorData(result.data)) return null;
        return (
          <div className="text-sm text-red-600">
            Error: {result.data.error}
          </div>
        );

      default:
        if ('message' in result.data && result.data.message) {
          return (
            <div className="text-sm text-gray-600">
              {result.data.message}
            </div>
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
            <span className={`inline-block w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <>
                <span className="text-sm text-gray-500">{results.length} results</span>
                <button
                  onClick={clearResults}
                  className="text-sm px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 -mx-6 px-6 overflow-y-auto min-h-0">
        <div className="space-y-2 pb-2">
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`font-medium text-sm ${
                    result.type === TestResultType.TEST_ERROR ? 'text-red-600' :
                    result.type === TestResultType.TEST_STOPPED ? 'text-orange-600' :
                    result.type === TestResultType.SCENARIO_COMPLETED ? 'text-green-600' :
                    result.type === TestResultType.PIECES_FOUND ? 'text-purple-600' :
                    result.type === TestResultType.PLAN_GENERATED ? 'text-blue-600' :
                    result.type === TestResultType.STEP_CREATED ? 'text-indigo-600' :
                    'text-gray-900'
                  }`}>
                    {result.type.split('_').map((word: string) => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                  </span>
                  {(result.data.scenarioTitle || result.data.title) && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      Scenario: {result.data.scenarioTitle || result.data.title}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date(result.data.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                {renderStepContent(result)}
              </div>
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