import { Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { TodoDetailsDrawer } from '../../todos/todos-details-drawer';

type AgentTestRunButtonProps = {
  agentId: string;
};

export const AgentTestRunButton = ({ agentId }: AgentTestRunButtonProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="neutral"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setDrawerOpen(true)}
      >
        <Play className="h-4 w-4" />
        <span>Test</span>
      </Button>
      <TodoDetailsDrawer
        open={drawerOpen}
        agentId={agentId}
        currentTodo={null}
        onStatusChange={() => {}}
        onOpenChange={setDrawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};
