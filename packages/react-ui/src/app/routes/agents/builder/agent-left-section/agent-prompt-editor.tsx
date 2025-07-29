import { Sparkles } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { debounce, isNil } from '@activepieces/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from 'i18next';

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
  const { mutate: enhacePrompt, isPending } =
    agentHooks.useEnhanceAgentPrompt();
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

  const handleEnhancePrompt = () => {
    enhacePrompt(
      { systemPrompt: localValue },
      {
        onSuccess: (data) => {
          updateAgent({ ...data });
        },
      },
    );
  };

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
    <div className="flex-1 rounded-md min-h-0 w-full cursor-text relative">
      <Tooltip>
        <TooltipTrigger className='absolute top-2 right-2'>
          <Button
            size="icon"
            variant="ghost"
            className='text-primary-300'
            onClick={handleEnhancePrompt}
            disabled={isPending || isNil(agent)}
          >
            {isPending ? (
              <Sparkles className="w-4 h-4 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t('Enhance prompt')}
        </TooltipContent>
      </Tooltip>

      {isPending && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm rounded-md flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <Sparkles className="w-6 h-6 animate-pulse text-primary" />
            <div className="text-sm font-medium text-foreground">
              {t('Enhancing prompt...')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Please wait while we improve your prompt')}
            </div>
          </div>
        </div>
      )}

      <Textarea
        id="system-prompt"
        value={localValue}
        onChange={(e) => handlePromptChange(e.target.value)}
        placeholder="Describe this agent's purpose, responsibilities, and any special instructions."
        className="flex-1 min-h-full max-h-full resize-none w-full focus-visible:ring-0 shadow-none h-full"
        maxRows={100}
        disabled={isNil(agent) || isPending}
        ref={textareaRef}
      />
    </div>
  );
};
