import { useWebSocket } from '../WebSocketContext';
import { isNil } from '@activepieces/shared';
import { WebsocketEventTypes } from '@activepieces/copilot-shared';
import { ThresholdControl } from './test-results/components/threshold-control';
import { PlanStepsControl } from './test-results/components/plan-steps-control';
import { useState } from 'react';

type PlanStep = {
  type: 'PIECE_TRIGGER' | 'PIECE' | 'ROUTER';
  description: string;
  required: boolean;
};

type StepConfig = {
  steps: PlanStep[];
};

export function Scenarios() {
  const { state, socket } = useWebSocket();
  const [threshold, setThreshold] = useState(0.35);
  const [customPrompt, setCustomPrompt] = useState('');
  const [stepConfig, setStepConfig] = useState<StepConfig>({
    steps: [
      {
        type: 'PIECE_TRIGGER' as const,
        description: 'Start with a trigger step',
        required: true
      },
      {
        type: 'PIECE' as const,
        description: 'Include necessary action steps',
        required: false
      }
    ]
  });

  function runTest(scenarioTitle: string) {
    socket?.emit(WebsocketEventTypes.RUN_TESTS, { 
      scenarioTitle,
      relevanceThreshold: threshold,
      customPrompt: customPrompt.trim() || undefined,
      stepConfig
    });
  }

  const isLoading = isNil(state?.scenarios)
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Available Scenarios</h2>
          <span
            className={`inline-block w-3 h-3 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
          />
        </div>
        {!socket?.connected && (
          <span className="text-sm text-red-500">
            Disconnected - Trying to reconnect...
          </span>
        )}
      </div>

      <div className="mb-4 space-y-4">
        <ThresholdControl defaultValue={threshold} onChange={setThreshold} />
        
        <div className="space-y-2">
          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700">
            Custom Planner Prompt (Optional)
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter a custom prompt for the planner..."
            className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <PlanStepsControl 
          value={stepConfig}
          onChange={setStepConfig}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
              >
                Scenario
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
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
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {scenario.title}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {scenario.prompt}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {isRunning ? (
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Stop Test
                      </button>
                    ) : (
                      <button
                        onClick={() => runTest(scenario.title)}
                        disabled={!socket?.connected}
                        className={`${socket?.connected
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
