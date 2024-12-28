import { Plus, Bot } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
}

// This would come from your API/state management
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Active Pieces Copilot',
    description: 'A general-purpose AI assistant that can help with various tasks.'
  },
  {
    id: '2',
    name: 'Ask HTTP',
    description: 'Specialized in reviewing and improving code quality.'
  },
  {
    id: '3',
    name: 'ASK AI ',
    description: 'Helps in writing and maintaining documentation.'
  }
];

export const AgentsList = () => {
  console.debug('Rendering AgentsList');

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Your Agents</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage and create new AI agents
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {mockAgents.map((agent) => (
            <div
              key={agent.id}
              className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                    {agent.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create New Agent</span>
        </button>
      </div>
    </div>
  );
}; 