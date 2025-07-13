import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Agent } from '@activepieces/shared';

interface AgentsIconsProps {
  agents: Agent[]
  maxVisible: number;
  className?: string;
}

export function AgentsIcons({ 
  agents, 
  maxVisible, 
  className 
}: AgentsIconsProps) {
  const displayAgents = agents.length > 0 ? agents : [];
  const visibleAgents = displayAgents.slice(0, maxVisible);
  const hasMore = displayAgents.length > maxVisible;
  const moreCount = displayAgents.length - maxVisible;

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex space-x-2">
        {visibleAgents.map((agent) => (
          <div
            key={agent.id}
            className="relative inline-block h-10 w-10 rounded-full ring-1 ring-accent"
            title={agent.displayName}
          >
            <img
              src={`https://cdn.activepieces.com/quicknew/agents/robots/robot_${agent.id}.png`}
              alt={agent.displayName}
              className="h-full w-full rounded-full"
              draggable={false}
            />
          </div>
        ))}
        
        {hasMore && (
          <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ring-1 ring-accent">
            <span className="flex items-center justify-center text-gray-600 font-medium text-xs">
              <Plus className="h-2 w-2" />
              {moreCount}
            </span>
            <span className="sr-only">
              {moreCount} more agents
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 