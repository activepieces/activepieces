import { useMutation } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Todo } from '@activepieces/shared';

import { agentsApi } from '../agents-api';

type AgentTestRunButtonProps = {
  onSuccess?: (todo: Todo) => void;
  onError?: () => void;
  agentId: string;
};

export const AgentTestRunButton = ({
  onSuccess,
  agentId,
}: AgentTestRunButtonProps) => {
  const [input, setInput] = useState('');

  const runAgentMutation = useMutation({
    mutationFn: (testPrompt: string) => {
      return agentsApi.run(agentId, { prompt: testPrompt });
    },
    onSuccess: (todo: Todo) => {
      setInput('');
      onSuccess?.(todo);
    },
  });

  const handleRunAgent = () => {
    if (!input.trim() || !agentId) return;
    runAgentMutation.mutate(input.trim());
  };

  return (
    <div className="relative">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Schedule a meeting with John Doe"
        className="min-h-[140px] resize-none pr-20"
      />
      <Button
        variant="neutral"
        size="sm"
        className="absolute bottom-4 right-4 flex items-center gap-2"
        onClick={handleRunAgent}
        disabled={runAgentMutation.isPending || !input.trim()}
      >
        <Play className="h-4 w-4" />
        <span>{runAgentMutation.isPending ? 'Running...' : 'Test'}</span>
      </Button>
    </div>
  );
};
