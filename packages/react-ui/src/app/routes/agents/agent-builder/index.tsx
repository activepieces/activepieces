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

import { AgentSettings } from './agent-settings';
import { AgentTestSection } from './agent-test-section';

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
  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      className="w-full"
      dismissible={false}
    >
      {trigger}
      <DrawerContent>
        <DrawerHeader>
          <div className="p-4">
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
        </DrawerHeader>

        <div className="flex flex-1 h-full">
          <div className="w-2/3 border-r">
            <AgentSettings agent={agent} refetch={refetch} />
          </div>

          <div className="w-1/3 px-4 py-4">
            {agent && <AgentTestSection agentId={agent.id} />}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
