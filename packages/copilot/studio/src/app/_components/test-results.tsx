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

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3002');

    ws.onopen = () => {
      console.debug('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const result = JSON.parse(event.data);
        setResults((prev) => [...prev, {
          ...result,
          timestamp: new Date().toISOString()
        }]);
      } catch (err) {
        console.error('Error parsing test result:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to test server');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.debug('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-semibold">Test Results</h2>
        <span className={`inline-block w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
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
              <span className="font-medium">{result.type}</span>
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
            No test results yet
          </div>
        )}
      </div>
    </div>
  );
}; 