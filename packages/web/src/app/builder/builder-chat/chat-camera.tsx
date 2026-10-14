import { useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

import { BuilderState, useBuilderStore } from '../builder-hooks';
import { flowCanvasConsts } from '../flow-canvas/utils/consts';
import { RightSideBarType } from '../types';

export function ChatCamera() {
  const store = useBuilderStore();
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timers = new Set<number>();
    let turnTailEndsAt = 0;

    const schedule = ({ fn, delayMs }: { fn: () => void; delayMs: number }) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, delayMs);
      timers.add(id);
    };

    const glideTo = (stepName: string) => {
      if (!store.getState().isFollowingChat) {
        return;
      }
      fitView({
        nodes: [{ id: stepName }],
        duration: GLIDE_DURATION_MS,
        minZoom: FOCUS_ZOOM,
        maxZoom: FOCUS_ZOOM,
      }).catch(() => undefined);
    };

    const openSettings = (stepName: string) => {
      const state = store.getState();
      if (state.isFollowingChat && state.selectedStep !== stepName) {
        state.selectStepByName(stepName, { fromAutoFocus: true });
      }
    };

    const focus = (stepName: string) => {
      const state = store.getState();
      state.setChatCameraStep(stepName);
      if (!state.isFollowingChat) {
        return;
      }
      const isSettingsOpen =
        state.rightSidebar === RightSideBarType.PIECE_SETTINGS;
      if (isSettingsOpen) {
        glideTo(stepName);
        schedule({
          fn: () => openSettings(stepName),
          delayMs: GLIDE_DURATION_MS * SETTINGS_SWAP_AT,
        });
        return;
      }
      openSettings(stepName);
      schedule({
        fn: () => glideTo(stepName),
        delayMs: flowCanvasConsts.SIDEBAR_ANIMATION_DURATION + 60,
      });
    };

    const queuedShots: string[] = [];
    let isPlayingShot = false;

    const playNextShot = () => {
      if (store.getState().isChatWaitingForUser) {
        isPlayingShot = false;
        return;
      }
      const next = queuedShots.shift();
      if (next === undefined) {
        isPlayingShot = false;
        return;
      }
      isPlayingShot = true;
      focus(next);
      schedule({ fn: playNextShot, delayMs: SHOT_DWELL_MS });
    };

    const queueShot = (stepName: string) => {
      const lastQueued = queuedShots.at(-1) ?? store.getState().chatCameraStep;
      if (lastQueued === stepName) {
        return;
      }
      queuedShots.push(stepName);
      if (!isPlayingShot) {
        playNextShot();
      }
    };

    const pullBackToWideShot = () => {
      if (isPlayingShot || store.getState().isChatWaitingForUser) {
        schedule({ fn: pullBackToWideShot, delayMs: SHOT_DWELL_MS });
        return;
      }
      store.getState().setChatCameraStep(null);
      if (!store.getState().isFollowingChat) {
        return;
      }
      fitView({
        duration: WIDE_SHOT_DURATION_MS,
        padding: 0.15,
        minZoom: 0.7,
        maxZoom: 1,
      }).catch(() => undefined);
    };

    const unsubscribe = store.subscribe((state, previous) => {
      const isWorking = state.chatActivity?.isWorking === true;
      const wasWorking = previous.chatActivity?.isWorking === true;
      if (isWorking && !wasWorking) {
        state.setFollowingChat(true);
      }
      if (!isWorking && wasWorking) {
        turnTailEndsAt = Date.now() + TURN_TAIL_MS;
        schedule({ fn: pullBackToWideShot, delayMs: TURN_TAIL_MS });
      }

      const startedWaiting =
        state.isChatWaitingForUser && !previous.isChatWaitingForUser;
      if (startedWaiting) {
        state.setChatCameraStep(null);
      }
      const stoppedWaiting =
        !state.isChatWaitingForUser && previous.isChatWaitingForUser;
      if (stoppedWaiting && !isPlayingShot) {
        playNextShot();
      }

      const resumedFollowing =
        state.isFollowingChat && !previous.isFollowingChat;
      if (resumedFollowing && state.chatCameraStep !== null) {
        focus(state.chatCameraStep);
        return;
      }

      const isChatTurnLive = isWorking || Date.now() < turnTailEndsAt;
      if (!isChatTurnLive) {
        return;
      }
      pickCameraTargets({ state, previous }).forEach(queueShot);
    });

    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [store, fitView]);

  return null;
}

function pickCameraTargets({
  state,
  previous,
}: {
  state: BuilderState;
  previous: BuilderState;
}): string[] {
  const previouslyEditing = previous.chatActivity?.editingStepNames ?? [];
  const newlyEditing = (state.chatActivity?.editingStepNames ?? []).filter(
    (stepName) => !previouslyEditing.includes(stepName),
  );
  const remoteChanges =
    state.recentlyChangedSteps !== previous.recentlyChangedSteps
      ? state.recentlyChangedSteps
      : [];
  return [...newlyEditing, ...remoteChanges];
}

const GLIDE_DURATION_MS = 1100;
const SETTINGS_SWAP_AT = 0.65;
const WIDE_SHOT_DURATION_MS = 1400;
const FOCUS_ZOOM = 1.1;
const TURN_TAIL_MS = 1500;
const SHOT_DWELL_MS = 2600;
