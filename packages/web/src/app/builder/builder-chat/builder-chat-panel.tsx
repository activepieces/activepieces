import { isNil } from '@activepieces/core-utils';
import { flowStructureUtil, Step } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { PanelLeft, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { ChatFlowContext } from '@/features/chat/lib/use-chat';
import { stepsHooks } from '@/features/pieces';

import { useBuilderStateContext, useBuilderStore } from '../builder-hooks';

import { useToggleBuilderChat } from './use-toggle-builder-chat';

export function BuilderChatPanel() {
  const store = useBuilderStore();
  const flowId = useBuilderStateContext((state) => state.flow.id);
  const toggleBuilderChat = useToggleBuilderChat();
  const [freshSession, setFreshSession] = useState(0);
  const [prompt, setPrompt] = useState<string | undefined>(undefined);

  const { data: latestConversationId, isLoading } = useQuery({
    queryKey: ['builder-chat-conversation', flowId],
    queryFn: async () => {
      const page = await chatApi.listConversations({ flowId, limit: 1 });
      return page.data[0]?.id ?? null;
    },
    staleTime: Infinity,
  });

  const flowContext: ChatFlowContext = useMemo(
    () => ({
      flowId,
      getSelectedStepName: () => store.getState().selectedStep,
      onActivity: (activity) => store.getState().setChatActivity(activity),
    }),
    [flowId, store],
  );

  const startFresh = (nextPrompt?: string) => {
    setPrompt(nextPrompt);
    setFreshSession((session) => session + 1);
  };

  return (
    <div className="flex h-full w-full flex-col border-r bg-gray-1">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm font-medium">{t('Chat')}</span>
        <div className="flex items-center gap-1">
          <HeaderAction label={t('Reset conversation')} onClick={startFresh}>
            <RefreshCw className="size-4" />
          </HeaderAction>
          <HeaderAction
            label={t('Minimize')}
            onClick={() => toggleBuilderChat(false)}
          >
            <PanelLeft className="size-4" />
          </HeaderAction>
        </div>
      </div>
      <div className="flex min-h-0 grow flex-col">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <AIChatBox
            key={`${flowId}-${freshSession}`}
            incognito={false}
            variant="panel"
            conversationId={freshSession === 0 ? latestConversationId : null}
            initialPrompt={prompt}
            flowContext={flowContext}
            placeholder={t('Ask chat to build or change this flow...')}
            emptyState={<QuickStartActions onPick={startFresh} />}
            inputContext={<SelectedStepChip />}
          />
        )}
      </div>
    </div>
  );
}

function HeaderAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-gray-11"
          aria-label={label}
          onClick={() => onClick()}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function QuickStartActions({ onPick }: { onPick: (prompt: string) => void }) {
  const actions = [
    {
      title: t('Build this flow for me'),
      prompt: t('Build this flow for me. Ask me what it should do first.'),
    },
    {
      title: t('Explain this flow'),
      prompt: t('Explain what this flow does, step by step.'),
    },
    {
      title: t('Auto configure my steps'),
      prompt: t(
        'Configure all the steps in this flow using the data available.',
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-2.5 px-4 pb-4 pt-2">
      {actions.map((action, index) => (
        <button
          key={action.title}
          type="button"
          onClick={() => onPick(action.prompt)}
          className="rounded-lg bg-gray-2 px-4 py-4 text-left text-sm font-medium text-gray-11 transition-colors hover:bg-gray-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {action.title}
        </button>
      ))}
    </div>
  );
}

function SelectedStepChip() {
  const step = useBuilderStateContext((state) =>
    isNil(state.selectedStep)
      ? undefined
      : flowStructureUtil.getStep(
          state.selectedStep,
          state.flowVersion.trigger,
        ),
  );
  if (isNil(step)) {
    return null;
  }
  return <StepChip key={step.name} step={step} />;
}

function StepChip({ step }: { step: Step }) {
  const { stepMetadata } = stepsHooks.useStepMetadata({ step });
  return (
    <span className="flex min-w-0 max-w-[160px] items-center gap-1.5 rounded-md bg-gray-3 px-1.5 py-0.5 text-xs text-gray-11 animate-in fade-in slide-in-from-left-2">
      {stepMetadata && (
        <img src={stepMetadata.logoUrl} alt="" className="size-3.5 shrink-0" />
      )}
      <TextWithTooltip tooltipMessage={step.displayName}>
        <p className="truncate">{step.displayName}</p>
      </TextWithTooltip>
    </span>
  );
}
