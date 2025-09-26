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
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AgentBuilderProvider,
  useBuilderAgentState,
} from '@/features/agents/lib/store/builder-agent-state-provider';
import { Agent, isNil } from '@activepieces/shared';

import { AgentLeftSection } from '@/features/agents/builder/agent-left-section';
import { AgentPreviewSection } from '@/features/agents/builder/agent-preview-section';
import { AgentRunsTable } from '@/features/agents/builder/agent-runs-table';
import { AgentSavingIndicator } from '@/features/agents/builder/agent-saving-indicator';
import { AgentStructuredOutput } from '@/features/agents/builder/agent-structured-output';
import { AgentToolSection } from '@/features/agents/builder/agent-tool-section';
import { LinkedFlowsSection } from '@/features/agents/builder/linked-flows-section';

type AgentBuilderProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean, agent: Agent) => void;
  trigger: ReactNode;
  showUseInFlow?: boolean;
  agent?: Agent;
};

enum AgentBuilderTabs {
  CONFIGURE = 'configure',
  RUNS = 'runs',
}

export const AgentBuilder = ({
  isOpen,
  onOpenChange,
  trigger,
  agent,
  showUseInFlow = false,
}: AgentBuilderProps) => {
  return (
    <Drawer
      open={isOpen}
      dismissible={false}
      direction="right"
      closeOnEscape={false}
    >
      {trigger}
      <DrawerContent className="w-full overflow-hidden h-full">
        {isNil(agent) && <LoadingScreen mode="container"></LoadingScreen>}
        {!isNil(agent) && (
          <AgentBuilderProvider agent={agent}>
            <AgentBuilderContent
              agent={agent}
              showUseInFlow={showUseInFlow}
              openChange={onOpenChange}
            />
          </AgentBuilderProvider>
        )}
      </DrawerContent>
    </Drawer>
  );
};

const AgentBuilderContent = ({
  showUseInFlow = false,
  agent: initialAgent,
  openChange,
}: {
  showUseInFlow: boolean;
  agent: Agent;
  openChange: (open: boolean, agent: Agent) => void;
}) => {
  const [isSaving, testSectionIsOpen, agent] = useBuilderAgentState((state) => [
    state.isSaving,
    state.testSectionIsOpen,
    state.agent,
  ]);

  const [activeTab, setActiveTab] = useState<AgentBuilderTabs>(
    AgentBuilderTabs.CONFIGURE,
  );

  return (
    <>
      <DrawerHeader>
        <div className="flex items-center justify-between py-2 px-4 w-full relative">
          <div className="flex items-center gap-1 min-w-0">
            <Button
              variant="basic"
              size={'icon'}
              className="text-foreground"
              onClick={() => {
                openChange(false, agent);
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4 min-w-0">
              <DrawerTitle className="truncate">
                {`${t('Edit')} ${initialAgent?.displayName}`}
              </DrawerTitle>
              <AgentSavingIndicator isSaving={isSaving} hasSaved={!isSaving} />
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as AgentBuilderTabs)}
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
        <div className="flex flex-1 h-full justify-center bg-accent overflow-hidden select-text">
          <AgentLeftSection />
          <div className="hidden md:block w-0 md:w-1/3 bg-background border-l h-full overflow-hidden">
            {testSectionIsOpen && <AgentPreviewSection />}
            {!testSectionIsOpen && (
              <div className="flex flex-col h-full p-4 gap-8 w-full bg-background overflow-hidden">
                <AgentToolSection />
                {showUseInFlow && <LinkedFlowsSection agent={initialAgent} />}
                <AgentStructuredOutput />
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === AgentBuilderTabs.RUNS && (
        <div className="flex flex-1 h-full justify-center">
          <AgentRunsTable agentId={initialAgent.id} />
        </div>
      )}
    </>
  );
};
