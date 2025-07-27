import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { Textarea } from '@/components/ui/textarea';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { debounce, isNil } from '@activepieces/shared';

type PromptFormValues = {
  systemPrompt: string;
};

export const AgentPromptEditior = () => {
  const [updateAgent, agent] = useBuilderAgentState((state) => [
    state.updateAgent,
    state.agent,
  ]);
  const [localValue, setLocalValue] = useState(agent?.systemPrompt ?? '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { setValue } = useForm<PromptFormValues>({
    defaultValues: {
      systemPrompt: agent?.systemPrompt ?? '',
    },
  });

  const debouncedUpdate = useMemo(() => {
    return debounce((value: string) => {
      if (isNil(agent)) return;
      updateAgent({ systemPrompt: value });
    }, 500);
  }, [agent, updateAgent]);

  const handlePromptChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      setValue('systemPrompt', value, { shouldDirty: true });
      debouncedUpdate(value);
    },
    [setValue, debouncedUpdate],
  );

  const handleContainerClick = useCallback(() => {
    if (textareaRef.current && !isNil(agent)) {
      textareaRef.current.focus();
    }
  }, [agent]);

  // Only update local value when agent changes externally (not from our own updates)
  useEffect(() => {
    if (
      agent?.systemPrompt !== localValue &&
      agent?.systemPrompt !== undefined
    ) {
      setLocalValue(agent.systemPrompt);
      setValue('systemPrompt', agent.systemPrompt, { shouldDirty: false });
    }
  }, [agent?.systemPrompt, setValue]);

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
