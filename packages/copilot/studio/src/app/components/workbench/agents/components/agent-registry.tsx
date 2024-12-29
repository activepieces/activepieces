import { useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useAgentRegistryStore } from '../../../../stores/use-agent-registry-store';
import { websocketService } from '../../../../services/websocket-service';

interface AgentRegistryProps {
  onSelectAgent?: (agentName: string) => void;
  selectedAgent?: string;
}

export const AgentRegistry = ({ onSelectAgent, selectedAgent }: AgentRegistryProps) => {
  const { agents } = useAgentRegistryStore();

  useEffect(() => {
    websocketService.requestAgentRegistry();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Agent Registry</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select an agent to view its configuration and start testing
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-2">
          {Array.from(agents.entries()).map(([name, config]) => (
            <button
              key={name}
              onClick={() => onSelectAgent?.(name)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedAgent === name
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {config.model} • Temperature: {config.temperature}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 