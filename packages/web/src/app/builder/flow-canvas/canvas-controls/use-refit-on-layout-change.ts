import { isNil } from '@activepieces/core-utils';
import { useReactFlow } from '@xyflow/react';
import { useUpdateEffect } from 'react-use';

import { useBuilderStateContext, useBuilderStore } from '../../builder-hooks';
import { RightSideBarType } from '../../types';
import { flowCanvasConsts } from '../utils/consts';

import { fitToViewZoom } from './use-fit-to-view';

export function useRefitOnLayoutChange() {
  const store = useBuilderStore();
  const { fitView, getViewport } = useReactFlow();
  const [isBuilderChatOpen, hasRightSidebar] = useBuilderStateContext(
    (state) => [
      state.isBuilderChatOpen,
      state.rightSidebar !== RightSideBarType.NONE,
    ],
  );
  useUpdateEffect(() => {
    const isChatDirectingCamera =
      store.getState().chatActivity?.isWorking === true &&
      store.getState().isFollowingChat;
    if (isChatDirectingCamera) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const { selectedStep } = store.getState();
      const options = isNil(selectedStep)
        ? {
            duration: REFIT_DURATION_MS,
            padding: 0.1,
            minZoom: fitToViewZoom.minFitZoom({ isBuilderChatOpen }),
            maxZoom: 1.25,
          }
        : {
            nodes: [{ id: selectedStep }],
            duration: REFIT_DURATION_MS,
            minZoom: getViewport().zoom,
            maxZoom: getViewport().zoom,
          };
      fitView(options).catch(() => undefined);
    }, flowCanvasConsts.SIDEBAR_ANIMATION_DURATION + 50);
    return () => window.clearTimeout(timeout);
  }, [isBuilderChatOpen, hasRightSidebar, store, fitView, getViewport]);
}

const REFIT_DURATION_MS = 300;
