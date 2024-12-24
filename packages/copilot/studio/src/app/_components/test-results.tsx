import React, { useEffect, useState } from 'react';

interface TestResult {
  type: string;
  data: any;
  timestamp: string;
}

export const TestResults: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3002');

    websocket.onopen = () => {
      console.debug('WebSocket connected');
      setIsConnected(true);
      setError(null);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        switch (result.type) {
          case 'TEST_ERROR':
            setError(result.data.error);
            setIsRunning(false);
            break;
          case 'TEST_SUMMARY':
          case 'TEST_STOPPED':
            setIsRunning(false);
            break;
          case 'TEST_STATE':
            setIsRunning(result.data.isRunning);
            break;
        }
        setResults((prev) => [...prev, {
          ...result,
          timestamp: new Date().toISOString()
        }]);
      } catch (err) {
        console.error('Error parsing test result:', err);
      }
    };

    websocket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to test server');
      setIsConnected(false);
      setWs(null);
    };

    websocket.onclose = () => {
      console.debug('WebSocket disconnected');
      setIsConnected(false);
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const handleRunTests = () => {
    if (!ws) return;
    setResults([]);
    setError(null);
    setIsRunning(true);
    ws.send(JSON.stringify({ type: 'RUN_TESTS' }));
  };

  const handleStopTests = () => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'STOP_TESTS' }));
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <span className={`inline-block w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunTests}
            disabled={!isConnected || isRunning}
            className={`px-4 py-2 rounded-md text-white ${
              isConnected && !isRunning
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
          {isRunning && (
            <button
              onClick={handleStopTests}
              className="px-4 py-2 rounded-md text-white bg-red-500 hover:bg-red-600"
            >
              Stop Tests
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded shadow">
            <div className="flex justify-between items-start">
              <span className={`font-medium ${
                result.type === 'TEST_ERROR' ? 'text-red-600' :
                result.type === 'TEST_STOPPED' ? 'text-orange-600' :
                'text-gray-900'
              }`}>
                {result.type}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <pre className="mt-2 text-sm whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ))}
        {results.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            {isRunning ? 'Running tests...' : 'No test results yet'}
          </div>
        )}
      </div>
    </div>
  );
}; 