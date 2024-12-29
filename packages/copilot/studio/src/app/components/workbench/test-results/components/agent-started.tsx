import { AgentCommandUpdate } from '@activepieces/copilot-shared';

interface AgentStartedProps {
  data: {
    timestamp: string;
    agentName: string;
    prompt: string;
  };
}

export const AgentStarted = ({ data }: AgentStartedProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">Agent: {data.agentName}</div>
          <div className="mt-1">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Prompt:</span>
              <div className="mt-1 p-2 bg-gray-100 rounded-md whitespace-pre-wrap">
                {data.prompt}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Started at: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}; 