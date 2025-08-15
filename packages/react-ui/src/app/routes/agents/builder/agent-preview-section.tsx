import { t } from 'i18next';
import { MessageSquare, ChevronsRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { MessageBox } from '@/components/custom/message-box';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { agentRunHooks } from '@/features/agents/lib/agent-hooks';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';

export const AgentPreviewSection = () => {
  const [testInput, setTestInput] = useState('');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [agent, setTestSectionIsOpen] = useBuilderAgentState((state) => [
    state.agent,
    state.setTestSectionIsOpen,
  ]);
  const { mutate: runAgent, isPending: isRunning } = agentRunHooks.useRun();

  const handleTestAgent = () => {
    if (!testInput.trim() || !agent?.id) return;

    runAgent(
      {
        externalId: agent.externalId,
        prompt: testInput,
      },
      {
        onSuccess: (agentRun) => {
          setCurrentRunId(agentRun.id);
          setTestInput('');
        },
        onError: (error) => {
          console.error('Failed to run agent:', error);
        },
      },
    );
  };

  const handleClosePreview = () => {
    setTestSectionIsOpen(false);
  };

  return (
    <div className="flex flex-col h-full px-6 py-4 gap-4 w-full bg-background overflow-hidden">
      <div
        className="flex items-center gap-2 cursor-pointer select-none mb-2"
        onClick={handleClosePreview}
        role="button"
        tabIndex={0}
        aria-label="Close Agent Preview"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClosePreview();
          }
        }}
      >
        <ChevronsRight className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold m-0">Agent Preview</h2>
      </div>
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        {currentRunId ? (
          <AgentTimeline agentRunId={currentRunId} className="p-0 h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare className="w-10 h-10 mb-2" />
            <div className="text-center font-medium text-sm">
              {t('Get started by giving your agent a task to try out.')}
            </div>
          </div>
        )}
      </ScrollArea>
      <MessageBox
        placeholder="Describe what would you like to agent"
        actionName="Run"
        value={testInput}
        onChange={setTestInput}
        onAction={handleTestAgent}
        loading={isRunning}
        loadingIcon={<Loader2 className="w-5 h-5 animate-spin" />}
        loadingText="Running..."
        disabled={!agent?.id}
        className="mt-auto"
      />
    </div>
  );
};
