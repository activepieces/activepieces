import { isNil } from '@activepieces/core-utils';
import { FlowTrigger, flowStructureUtil } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Crosshair, Square } from 'lucide-react';
import { useMemo } from 'react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';
import { ChatCameraShot } from '../state/builder-chat-state';

export function ChatCanvasStatus() {
  const [chatActivity, shot, trigger, isFollowing, setFollowing, isWaiting] =
    useBuilderStateContext((state) => [
      state.chatActivity,
      state.chatCameraShot,
      state.flowVersion.trigger,
      state.isFollowingChat,
      state.setFollowingChat,
      state.isChatWaitingForUser,
    ]);
  const caption = useMemo(() => captionFor({ shot, trigger }), [shot, trigger]);

  if (isWaiting) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-accent-7 bg-accent-2 px-4 py-1.5 text-sm text-accent-11 shadow-md animate-in fade-in slide-in-from-bottom-2">
          <ArrowLeft className="size-4 animate-pulse" />
          {t('Chat needs your answer before it carries on')}
        </div>
      </div>
    );
  }

  if (!chatActivity?.isWorking) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-center">
      <div className="pointer-events-auto flex max-w-[90%] items-center gap-2 rounded-full border bg-gray-1 py-1 pl-4 pr-1 shadow-md animate-in fade-in slide-in-from-bottom-2">
        <LoadingSpinner className="size-4 shrink-0" />
        <span
          key={caption}
          className="truncate text-sm animate-in fade-in slide-in-from-bottom-1"
        >
          {caption}
        </span>
        <Button
          variant={isFollowing ? 'ghost' : 'secondary'}
          size="sm"
          onClick={() => setFollowing(!isFollowing)}
        >
          <Crosshair className="size-3" />
          {isFollowing ? t('Stop following') : t('Follow')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => chatActivity.stop()}>
          <Square className="size-3" />
          {t('Stop')}
        </Button>
      </div>
    </div>
  );
}

function captionFor({
  shot,
  trigger,
}: {
  shot: ChatCameraShot | null;
  trigger: FlowTrigger;
}): string {
  if (shot?.kind === 'testing-flow') {
    return t('Chat is testing the flow…');
  }
  const stepName = isNil(shot)
    ? undefined
    : flowStructureUtil.getStep(shot.stepName, trigger)?.displayName;
  if (isNil(shot) || isNil(stepName)) {
    return t('Chat is editing this flow…');
  }
  switch (shot.kind) {
    case 'testing':
      return t('Chat is testing {stepName}…', { stepName });
    case 'adding-after':
      return t('Chat is adding a step after {stepName}…', { stepName });
    case 'editing':
      return t('Chat is editing {stepName}…', { stepName });
  }
}
