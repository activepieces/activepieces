import { isNil } from '@activepieces/core-utils';
import { flowStructureUtil, Step } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { PanelLeft, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import autoConfigureImage from '@/assets/img/custom/builder-chat/auto-configure.png';
import manipulateDataImage from '@/assets/img/custom/builder-chat/manipulate-data.png';
import understandImage from '@/assets/img/custom/builder-chat/understand.png';
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
import { cn } from '@/lib/utils';

import { useBuilderStateContext, useBuilderStore } from '../builder-hooks';

export function BuilderChatPanel() {
  const store = useBuilderStore();
  const flowId = useBuilderStateContext((state) => state.flow.id);
  const toggleBuilderChat = useBuilderStateContext(
    (state) => state.setBuilderChatOpen,
  );
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
      onWaitingForUser: (waiting) =>
        store.getState().setChatWaitingForUser(waiting),
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
        <span className="text-sm font-medium">{t('AI Assistant')}</span>
        <div className="flex items-center gap-1">
          <HeaderAction label={t('Reset Conversation')} onClick={startFresh}>
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
            placeholder={t('Ask to configure your steps...')}
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
          className="size-6 rounded text-gray-9 hover:bg-gray-3"
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
      title: t('Manipulate my data'),
      prompt: t(
        'Help me process and transform the data to the required format',
      ),
      image: manipulateDataImage,
      imageClassName: 'h-[110px] w-[235px]',
    },
    {
      title: t('Help me to understand'),
      prompt: t('Explain the available data and how I can use it'),
      image: understandImage,
      imageClassName: 'h-[118px] w-[174px]',
    },
    {
      title: t('Auto configure my steps'),
      prompt: t('Automatically configure all fields using the available data'),
      image: autoConfigureImage,
      imageClassName: 'h-[110px] w-[235px]',
    },
  ];
  return (
    <div className="flex flex-col gap-2.5 px-4 pb-4 pt-4">
      {actions.map((action, index) => (
        <button
          key={action.title}
          type="button"
          onClick={() => onPick(action.prompt)}
          className="flex h-40 w-full flex-col items-start gap-3.5 overflow-hidden rounded-lg bg-gray-2 px-4 pt-4 text-left transition-colors hover:bg-gray-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <span className="text-sm font-medium text-gray-11">
            {action.title}
          </span>
          <img
            src={action.image}
            alt=""
            className={cn('shrink-0 object-cover', action.imageClassName)}
          />
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
  if (isNil(stepMetadata)) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-gray-3 animate-in fade-in slide-in-from-left-2">
          <img src={stepMetadata.logoUrl} alt="" className="size-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{step.displayName}</TooltipContent>
    </Tooltip>
  );
}
