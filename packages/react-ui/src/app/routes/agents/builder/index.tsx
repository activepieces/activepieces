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
import {
  BuilderAgentProvider,
  useBuilderAgentState,
} from '@/features/agents/lib/store/builder-agent-state-provider';
import { UseAgentButton } from '@/features/agents/use-agent-button';
import { Agent } from '@activepieces/shared';

import { AgentLeftSection } from './agent-left-section';
import { AgentRightSection } from './agent-right-section';
import { AgentSavingIndicator } from './agent-saving-indicator';

interface AgentBuilderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  agent: Agent;
  onChange?: (agent: Agent) => void;
  showUseInFlow?: boolean;
}

const AgentBuilderContent = ({
  isOpen,
  onOpenChange,
  trigger,
  agent,
  showUseInFlow = false,
}: AgentBuilderProps) => {
  const [isSaving] = useBuilderAgentState((state) => [state.isSaving]);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      dismissible={false}
      direction="right"
    >
      {trigger}
      <DrawerContent className="w-full overflow-auto overflow-x-hidden">
        <DrawerHeader>
          <div className="flex items-center gap-1 justify-between py-2 px-4 w-full">
            <div className="flex items-center gap-1">
              <Button
                variant="basic"
                size={'icon'}
                className="text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <DrawerTitle>
                  {agent
                    ? `${t('Edit')} ${agent?.displayName}`
                    : `${t('Creating Agent')}...`}
                </DrawerTitle>
                <AgentSavingIndicator
                  isSaving={isSaving}
                  hasSaved={!isSaving}
                />
              </div>
            </div>
            {showUseInFlow && <UseAgentButton agentId={agent.id} />}
          </div>
        </DrawerHeader>

        <div className="flex flex-1 h-full justify-center">
          <div className="flex flex-1 h-full bg-accent">
            <AgentLeftSection agent={agent} />
            <div className="hidden md:block w-0 md:w-1/3 bg-background border-l">
              <AgentRightSection />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const AgentBuilder = ({
  isOpen,
  onOpenChange,
  trigger,
  onChange,
  agent,
  showUseInFlow = false,
}: AgentBuilderProps) => (
  <BuilderAgentProvider agent={agent}>
    <AgentBuilderContent
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      trigger={trigger}
      agent={agent}
      onChange={onChange}
      showUseInFlow={showUseInFlow}
    />
  </BuilderAgentProvider>
);
