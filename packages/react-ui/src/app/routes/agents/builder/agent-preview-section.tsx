import { motion, AnimatePresence } from 'framer-motion';
import { t } from 'i18next';
import { Loader2, MessageSquare, ChevronsRight, Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
    <AnimatePresence>
      <motion.div
        key="agent-preview-section"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40,
          duration: 0.3,
        }}
        className="flex flex-col h-full px-6 py-4 gap-4 w-full bg-background overflow-hidden"
      >
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
        <div className="flex flex-col gap-2 mt-auto border rounded-lg p-2 bg-background">
          <Textarea
            className="flex-1 resize-none border-none focus:ring-0 focus:border-none shadow-none"
            placeholder="Describe what would you like to agent"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            rows={2}
            disabled={isRunning}
          />
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestAgent}
              disabled={!testInput.trim() || isRunning || !agent?.id}
            >
              {isRunning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
