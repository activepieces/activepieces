import React, { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

interface TestResult {
  type: string;
  data: any;
  timestamp: string;
}

export const TestResults: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const { ws, isConnected } = useWebSocket('ws://localhost:3002');

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        // Only add results that are related to tests
        if (['TEST_ERROR', 'TEST_STOPPED', 'SCENARIO_COMPLETED', 'TEST_SUMMARY'].includes(result.type)) {
          setResults((prev) => [...prev, {
            ...result,
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error('Error parsing test result:', err);
      }
    };
  }, [ws]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <span className={`inline-block w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
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
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {result.data.scenarioTitle && (
              <div className="mt-1 text-sm text-gray-600">
                Scenario: {result.data.scenarioTitle}
              </div>
            )}
            <pre className="mt-2 text-xs whitespace-pre-wrap bg-white p-2 rounded">
              {JSON.stringify(result.data, null, 2)}
            </pre>
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