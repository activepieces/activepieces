import { AgentCommandUpdate } from '@activepieces/copilot-shared';
import { useMemo } from 'react';

interface AgentCompletedProps {
  data: {
    timestamp: string;
    agentName: string;
    result: unknown;
  };
}

export const AgentCompleted = ({ data }: AgentCompletedProps) => {
  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(data.result, null, 2);
    } catch (error) {
      console.error('Error formatting JSON:', error);
      return String(data.result);
    }
  }, [data.result]);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">
            Agent: {data.agentName}
          </div>
          <div className="mt-1">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Result:</span>
              <pre className="mt-1 p-3 bg-gray-100 rounded-md overflow-x-auto font-mono text-xs leading-relaxed">
                {formattedJson}
              </pre>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Completed at: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}; 