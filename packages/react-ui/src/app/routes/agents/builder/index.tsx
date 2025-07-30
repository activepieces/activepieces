import { t } from 'i18next';
import { ArrowLeft, Settings, Play } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BuilderAgentProvider,
  useBuilderAgentState,
} from '@/features/agents/lib/store/builder-agent-state-provider';
import { Agent } from '@activepieces/shared';

import { AgentLeftSection } from './agent-left-section';
import { AgentPreviewSection } from './agent-preview-section';
import { AgentRunsTable } from './agent-runs-table';
import { AgentSavingIndicator } from './agent-saving-indicator';
import { AgentStructuredOutput } from './agent-structured-output';
import { AgentToolSection } from './agent-tool-section';
import { LinkedFlowsSection } from './linked-flows-section';

interface AgentBuilderProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  agent: Agent;
  showUseInFlow?: boolean;
  onChange?: (agent: Agent) => void;
}

enum AgentBuilderTabs {
  CONFIGURE = 'configure',
  RUNS = 'runs',
}

const AgentBuilderContent = ({
  isOpen,
  onOpenChange,
  trigger,
  agent,
  showUseInFlow = false,
  onChange,
}: AgentBuilderProps) => {
  const [isSaving, testSectionIsOpen, currentAgent] = useBuilderAgentState(
    (state) => [state.isSaving, state.testSectionIsOpen, state.agent],
  );
  const [activeTab, setActiveTab] = useState<AgentBuilderTabs>(
    AgentBuilderTabs.CONFIGURE,
  );

  const handleOpenChange = (open: boolean) => {
    if (!open && onChange) {
      onChange(currentAgent);
    }
    onOpenChange(open);
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      dismissible={false}
      direction="right"
      closeOnEscape={false}
    >
      {trigger}
      <DrawerContent className="w-full overflow-hidden">
        <DrawerHeader>
          <div className="flex items-center justify-between py-2 px-4 w-full relative">
            <div className="flex items-center gap-1 min-w-0">
              <Button
                variant="basic"
                size={'icon'}
                className="text-foreground"
                onClick={() => handleOpenChange(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4 min-w-0">
                <DrawerTitle className="truncate">
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

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as AgentBuilderTabs)
                }
                className="w-auto"
              >
                <TabsList variant="outline" className="h-9">
                  <TabsTrigger
                    value={AgentBuilderTabs.CONFIGURE}
                    variant="outline"
                    className="flex items-center gap-2 px-3"
                  >
                    <Settings className="h-4 w-4" />
                    {t('Configure')}
                  </TabsTrigger>
                  <TabsTrigger
                    value={AgentBuilderTabs.RUNS}
                    variant="outline"
                    className="flex items-center gap-2 px-3"
                  >
                    <Play className="h-4 w-4" />
                    {t('Runs')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </DrawerHeader>

        {activeTab === AgentBuilderTabs.CONFIGURE && (
          <div className="flex flex-1 h-full justify-center bg-accent overflow-hidden">
            <AgentLeftSection agent={agent} />
            <div className="hidden md:block w-0 md:w-1/3 bg-background border-l h-full overflow-hidden">
              {testSectionIsOpen && <AgentPreviewSection />}
              {!testSectionIsOpen && (
                <div className="flex flex-col h-full p-4 gap-8 w-full bg-background overflow-hidden">
                  <AgentToolSection />
                  {showUseInFlow && <LinkedFlowsSection agent={agent} />}
                  <AgentStructuredOutput />
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === AgentBuilderTabs.RUNS && (
          <div className="flex flex-1 h-full justify-center">
            <AgentRunsTable agentId={agent.id} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export const AgentBuilder = ({
  isOpen,
  onOpenChange,
  trigger,
  agent,
  showUseInFlow = false,
  onChange,
}: AgentBuilderProps) => (
  <BuilderAgentProvider agent={agent}>
    <AgentBuilderContent
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      trigger={trigger}
      agent={agent}
      showUseInFlow={showUseInFlow}
      onChange={onChange}
    />
  </BuilderAgentProvider>
);
