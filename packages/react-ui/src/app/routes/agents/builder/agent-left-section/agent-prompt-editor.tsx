import { useRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Textarea } from '@/components/ui/textarea';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { isNil } from '@activepieces/shared';

type FormValues = {
  systemPrompt: string;
};

export const AgentPromptEditior = () => {
  const [updateAgent, agent] = useBuilderAgentState((state) => [
    state.updateAgent,
    state.agent,
  ]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { register, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      systemPrompt: agent?.systemPrompt ?? '',
    },
  });

  useEffect(() => {
    setValue('systemPrompt', agent?.systemPrompt ?? '');
  }, [agent?.systemPrompt, setValue]);

  const handleContainerClick = useCallback(() => {
    if (textareaRef.current && !isNil(agent)) {
      textareaRef.current.focus();
    }
  }, [agent]);

  const systemPromptValue = watch('systemPrompt');

  return (
    <form
      className="flex-1 min-h-0 w-full cursor-text"
      onClick={handleContainerClick}
      onSubmit={(e) => e.preventDefault()}
    >
      <Textarea
        id="system-prompt"
        {...register('systemPrompt')}
        value={systemPromptValue}
        onChange={(e) => {
          setValue('systemPrompt', e.target.value, { shouldDirty: true });
          updateAgent({ systemPrompt: e.target.value }, true);
        }}
        placeholder="Describe this agent's purpose, responsibilities, and any special instructions."
        className="flex-1 min-h-0 resize-none w-full border-none focus:ring-0 focus:border-none shadow-none p-0 h-full"
        disabled={isNil(agent)}
        ref={textareaRef}
      />
    </form>
  );
};
