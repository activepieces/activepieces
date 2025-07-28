import { useState, useRef, useCallback, useEffect } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { debounce, isNil } from '@activepieces/shared';

export const AgentPromptEditior = () => {
  const [updateAgent, agent] = useBuilderAgentState((state) => [
    state.updateAgent,
    state.agent,
  ]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [localValue, setLocalValue] = useState(() => agent?.systemPrompt ?? '');

  const agentRef = useRef(agent);
  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  const debouncedUpdate = useRef(
    debounce((value: string) => {
      if (isNil(agentRef.current)) return;
      updateAgent({ systemPrompt: value });
    }, 500),
  ).current;

  useEffect(() => {
    if (
      agent?.systemPrompt !== undefined &&
      agent?.systemPrompt !== localValue
    ) {
      setLocalValue(agent.systemPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.systemPrompt]);

  const handlePromptChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      debouncedUpdate(value);
    },
    [debouncedUpdate],
  );

  const handleContainerClick = useCallback(() => {
    if (textareaRef.current && !isNil(agent)) {
      textareaRef.current.focus();
    }
  }, [agent]);

  return (
    <div
      className="flex-1 min-h-0 w-full cursor-text"
      onClick={handleContainerClick}
    >
      <Textarea
        id="system-prompt"
        value={localValue}
        onChange={(e) => handlePromptChange(e.target.value)}
        placeholder="Describe this agent's purpose, responsibilities, and any special instructions."
        className="flex-1 min-h-0 resize-none w-full border-none focus:ring-0 focus:border-none shadow-none p-0 h-full"
        disabled={isNil(agent)}
        ref={textareaRef}
      />
    </div>
  );
};
