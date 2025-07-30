import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { isNil } from '@activepieces/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from 'i18next';

type FormValues = {
  systemPrompt: string;
};

export const AgentPromptEditior = () => {
  const [updateAgent, agent] = useBuilderAgentState((state) => [
    state.updateAgent,
    state.agent,
  ]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { mutate: enhancePrompt, isPending } = agentHooks.useEnhanceAgentPrompt();

  const { register, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      systemPrompt: agent?.systemPrompt ?? '',
    },
  });

  useEffect(() => {
    setValue('systemPrompt', agent?.systemPrompt ?? '');
  }, [agent?.systemPrompt, setValue]);

  const systemPromptValue = watch('systemPrompt');

  const handleEnhancePrompt = () => {
    enhancePrompt(
      { systemPrompt: systemPromptValue },
      {
        onSuccess: (data) => {
          updateAgent({ ...data });
        },
      },
    );
  };

  return (
    <div className="flex-1 rounded-md min-h-0 w-full cursor-text relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-primary-300 absolute top-2 right-2"
            onClick={handleEnhancePrompt}
            disabled={isPending || isNil(agent)}
            tabIndex={-1}
            type="button"
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

      <form
        className="flex-1 min-h-0 w-full cursor-text"
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
          className="flex-1 min-h-full max-h-full resize-none w-full focus-visible:ring-0 shadow-none h-full px-0 py-0 border-0"
          maxRows={100}
          disabled={isNil(agent) || isPending}
          ref={textareaRef}
        />
      </form>
    </div>
  );
};
