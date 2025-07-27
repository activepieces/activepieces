import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FlaskConical, Loader2, MessageCircle, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { agentRunHooks } from '@/features/agents/lib/agent-hooks';
import { t } from 'i18next';

export const AgentRightSection = () => {
  const [testInput, setTestInput] = useState('');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [agent] = useBuilderAgentState((state) => [state.agent]);
  const { mutate: runAgent, isPending: isRunning } = agentRunHooks.useRun();

  const handleTestAgent = () => {
    if (!testInput.trim() || !agent?.id) return;

    runAgent(
      {
        agentId: agent.id,
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
      }
    );
  };

  return (
    <div className="flex flex-col h-full px-6 py-4 gap-4 w-full bg-background">
      <h2 className="text-lg font-semibold mb-2">Agent Preview</h2>
      <div className="flex-1">
        {currentRunId ? (
          <AgentTimeline agentRunId={currentRunId} className='p-0'/>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare className="w-10 h-10 mb-2" />
            <div className="text-center font-medium text-sm">
              {t('Get started by giving your agent a task to try out.')}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-auto border rounded-lg p-2 bg-background">
        <Textarea
          className="flex-1 resize-none border-none focus:ring-0 focus:border-none shadow-none"
          placeholder="Describe what would you like to agent"
          value={testInput}
          onChange={e => setTestInput(e.target.value)}
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
              <FlaskConical className="w-5 h-5" />
            )}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>
    </div>
  );
};