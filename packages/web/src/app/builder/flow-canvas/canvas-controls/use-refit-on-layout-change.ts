import { isNil } from '@activepieces/core-utils';
import { useReactFlow } from '@xyflow/react';
import { useEffect, useRef } from 'react';

import { useBuilderStateContext, useBuilderStore } from '../../builder-hooks';
import { RightSideBarType } from '../../types';
import { flowCanvasConsts } from '../utils/consts';

export function useRefitOnLayoutChange() {
  const store = useBuilderStore();
  const { fitView, getViewport } = useReactFlow();
  const [isBuilderChatOpen, hasRightSidebar] = useBuilderStateContext(
    (state) => [
      state.isBuilderChatOpen,
      state.rightSidebar !== RightSideBarType.NONE,
    ],
  );
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      const { selectedStep } = store.getState();
      const options = isNil(selectedStep)
        ? {
            duration: REFIT_DURATION_MS,
            padding: 0.1,
            minZoom: isBuilderChatOpen ? 0.7 : 0.9,
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
