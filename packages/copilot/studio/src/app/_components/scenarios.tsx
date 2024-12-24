import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../WebSocketContext';

interface Scenario {
  title: string;
  prompt: string;
}

interface TestResult {
  type: string;
  data: {
    error?: string;
    message?: string;
    timestamp: string;
    scenarioTitle?: string;
    title?: string;
    scenarios?: Scenario[];
    output?: any;
  };
}

export function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const { ws, error: wsError, isConnected } = useWebSocket();
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ [key: string]: 'running' | 'stopped' | 'idle' }>({});

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const result: TestResult = JSON.parse(event.data);
      console.debug('Scenarios received:', result);

      switch (result.type) {
        case 'TEST_ERROR':
          setError(result.data.error || 'Unknown error');
          if (result.data.scenarioTitle) {
            setTestStatus(prev => ({
              ...prev,
              [result.data.scenarioTitle as string]: 'stopped'
            }));
          }
          break;
        case 'TEST_STOPPED':
        case 'TEST_SUMMARY':
        case 'SCENARIO_COMPLETED':
          if (result.data.scenarioTitle || result.data.title) {
            setTestStatus(prev => ({
              ...prev,
              [(result.data.scenarioTitle || result.data.title) as string]: 'stopped'
            }));
          }
          break;
        case 'TEST_STATE':
          if (result.data.scenarios) {
            setScenarios(result.data.scenarios);
            setLoading(false);
          }
          break;
        case 'SCENARIOS':
          if (result.data.scenarios) {
            setScenarios(result.data.scenarios);
            setLoading(false);
          }
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
      setError('Failed to parse server message');
    }
  }, []);

  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  useEffect(() => {
    if (!ws) return;

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, handleMessage]);

  // Request scenarios if they haven't been received in TEST_STATE
  useEffect(() => {
    if (ws && loading && isConnected) {
      console.debug('Requesting scenarios...');
      ws.send(JSON.stringify({ type: 'GET_SCENARIOS' }));
    }
  }, [ws, loading, isConnected]);

  const runTest = useCallback((scenarioTitle: string) => {
    if (!ws || !isConnected) return;

    setTestStatus(prev => ({
      ...prev,
      [scenarioTitle]: 'running'
    }));

    ws.send(JSON.stringify({
      type: 'RUN_TESTS',
      data: {
        scenarioTitle
      }
    }));
  }, [ws, isConnected]);

  const stopTest = useCallback((scenarioTitle: string) => {
    if (!ws || !isConnected) return;

    ws.send(JSON.stringify({
      type: 'STOP_TESTS',
      data: {
        scenarioTitle
      }
    }));
  }, [ws, isConnected]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-600 p-4 bg-red-50 rounded-lg max-w-md">
          {error}
          {isConnected && (
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Available Scenarios</h2>
          <span className={`inline-block w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        {!isConnected && <span className="text-sm text-red-500">Disconnected - Trying to reconnect...</span>}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Scenario
              </th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Description
              </th>
              <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scenarios.map((scenario, index) => {
              const isRunning = testStatus[scenario.title] === 'running';
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{scenario.title}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-gray-500 line-clamp-2">{scenario.prompt}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {isRunning ? (
                      <button
                        onClick={() => stopTest(scenario.title)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Stop Test
                      </button>
                    ) : (
                      <button
                        onClick={() => runTest(scenario.title)}
                        disabled={!isConnected}
                        className={`${
                          isConnected 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-400 cursor-not-allowed'
                        } text-white px-3 py-1 rounded transition-colors text-sm`}
                      >
                        Test Scenario
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 