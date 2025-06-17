import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Agent } from '@activepieces/shared';

import { AgentIdentityCard } from './agent-identity-card';
import { AgentBehaviourDialog } from './agent-behaviour-dialog';
import { AgentTodosSidebar } from './agent-todos-sidebar';

interface AgentBuilderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  agent?: Agent;
  refetch: () => void;
}

export const AgentBuilder = ({
  isOpen,
  onOpenChange,
  refetch,
  trigger,
  agent,
}: AgentBuilderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      // Remove overflow-auto to prevent horiczontal scroll, and set max-w-screen-lg for a reasonable max width
      className="w-full max-w-screen mx-auto"
      dismissible={false}
    >
      {trigger}
      <DrawerContent>
        <DrawerHeader>
          <div className="p-4">
            <div className="flex items-center gap-1 justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="basic"
                  size={'icon'}
                  className="text-foreground"
                  onClick={() => onOpenChange(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <DrawerTitle>
                  {agent ? 'Edit Agent' : 'Agent Builder'}
                </DrawerTitle>
              </div>
            </div>
          </div>
        </DrawerHeader>

        {/* Prevent horizontal scroll by using min-w-0 and overflow-x-hidden */}
        <div className="flex h-full min-w-0 overflow-x-hidden">
          {/* Sidebar */}
          <div className="w-80 min-w-0 border-r border-border">
            <div className="px-4">
              {agent && <AgentTodosSidebar agentId={agent.id} />}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 px-4">
            <div className="w-full px-6 pb-6 space-y-6">
              <AgentIdentityCard
                agent={agent}
                refetch={refetch}
                onEditClick={() => setIsDialogOpen(true)}
              />

              <AgentBehaviourDialog
                agent={agent}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                refetch={refetch}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
