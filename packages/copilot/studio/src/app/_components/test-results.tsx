import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../WebSocketContext';

interface TestResult {
  type: string;
  data: {
    error?: string;
    message?: string;
    timestamp: string;
    scenarioTitle?: string;
    title?: string;
    prompt?: string;
    output?: any;
  };
}

export const TestResults: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const { ws, isConnected } = useWebSocket();

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const result = JSON.parse(event.data);
      console.debug('Test Results received:', result);

      // Handle all relevant test messages
      if (
        result.type === 'TEST_ERROR' ||
        result.type === 'TEST_STOPPED' ||
        result.type === 'SCENARIO_COMPLETED' ||
        result.type === 'TEST_SUMMARY' ||
        (result.type === 'TEST_STATE' && result.data.isRunning)
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <span className={`inline-block w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Results
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {results.map((result, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <span className={`font-medium text-sm ${
                result.type === 'TEST_ERROR' ? 'text-red-600' :
                result.type === 'TEST_STOPPED' ? 'text-orange-600' :
                result.type === 'SCENARIO_COMPLETED' ? 'text-green-600' :
                'text-gray-900'
              }`}>
                {result.type === 'SCENARIO_COMPLETED' ? 'Scenario Result' : result.type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(result.data.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {(result.data.scenarioTitle || result.data.title) && (
              <div className="mt-1 text-sm text-gray-600">
                Scenario: {result.data.scenarioTitle || result.data.title}
              </div>
            )}
            {result.data.error && (
              <div className="mt-1 text-sm text-red-600">
                Error: {result.data.error}
              </div>
            )}
            {result.data.output && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Output:</div>
                <pre className="text-xs whitespace-pre-wrap bg-white p-2 rounded border border-gray-200">
                  {JSON.stringify(result.data.output, null, 2)}
                </pre>
              </div>
            )}
            {!result.data.output && result.data.message && (
              <div className="mt-1 text-sm text-gray-600">
                {result.data.message}
              </div>
            )}
          </div>
        ))}
        {results.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No test results yet. Run a scenario to see results here.
          </div>
        )}
      </div>
    </div>
  );
}; 