import { t } from 'i18next';
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

interface AgentBuilderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  agent?: Agent;
  refetch: () => void;
  onChange?: (agent: Agent) => void;
  hideUseAgentButton?: boolean;
}

export const AgentBuilder = ({
  isOpen,
  onOpenChange,
  refetch,
  trigger,
  agent,
  onChange,
  hideUseAgentButton,
}: AgentBuilderProps) => {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      dismissible={false}
      direction="right"
    >
      {trigger}
      <DrawerContent className="w-full overflow-auto">
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
                  {agent
                    ? `${t('Edit')} ${agent?.displayName}`
                    : `${t('Creating Agent')}...`}
                </DrawerTitle>
              </div>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex flex-1 h-full justify-center">
          <div
            className="w-full max-w-3xl px-4"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          >
            <AgentSettings
              agent={agent}
              refetch={refetch}
              onChange={onChange}
              hideUseAgentButton={hideUseAgentButton}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
