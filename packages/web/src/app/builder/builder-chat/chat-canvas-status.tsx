import { isNil } from '@activepieces/core-utils';
import { flowStructureUtil } from '@activepieces/shared';
import { t } from 'i18next';
import { Crosshair, Square } from 'lucide-react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';

export function ChatCanvasStatus() {
  const [chatActivity, cameraStepName, isFollowing, setFollowing] =
    useBuilderStateContext((state) => [
      state.chatActivity,
      isNil(state.chatCameraStep)
        ? null
        : flowStructureUtil.getStep(
            state.chatCameraStep,
            state.flowVersion.trigger,
          )?.displayName ?? null,
      state.isFollowingChat,
      state.setFollowingChat,
    ]);

  if (!chatActivity?.isWorking) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-center">
      <div className="pointer-events-auto flex max-w-[90%] items-center gap-2 rounded-full border bg-gray-1 py-1 pl-4 pr-1 shadow-md animate-in fade-in slide-in-from-bottom-2">
        <LoadingSpinner className="size-4 shrink-0" />
        <span
          key={cameraStepName ?? 'flow'}
          className="truncate text-sm animate-in fade-in slide-in-from-bottom-1"
        >
          {isNil(cameraStepName)
            ? t('Chat is editing this flow…')
            : t('Chat is editing {stepName}…', { stepName: cameraStepName })}
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
