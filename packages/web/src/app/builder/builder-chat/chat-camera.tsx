import { isNil } from '@activepieces/core-utils';
import { useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

import { BuilderState, useBuilderStore } from '../builder-hooks';
import { flowCanvasConsts } from '../flow-canvas/utils/consts';
import { ChatCameraShot } from '../state/builder-chat-state';
import { RightSideBarType } from '../types';

export function ChatCamera() {
  const store = useBuilderStore();
  const { fitView, getNode, getInternalNode, getViewport } = useReactFlow();

  useEffect(() => {
    const timers = new Set<number>();
    let turnTailEndsAt = 0;
    let lastFramedStep: string | null = null;

    const schedule = ({ fn, delayMs }: { fn: () => void; delayMs: number }) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, delayMs);
      timers.add(id);
    };

    const isFollowing = () => store.getState().isFollowingChat;

    const whenMeasured = ({
      stepName,
      fn,
      attempt = 0,
    }: {
      stepName: string;
      fn: () => void;
      attempt?: number;
    }) => {
      if (!isNil(getInternalNode(stepName)?.measured.width)) {
        fn();
        return;
      }
      if (attempt < MEASURE_RETRIES) {
        schedule({
          fn: () => whenMeasured({ stepName, fn, attempt: attempt + 1 }),
          delayMs: MEASURE_INTERVAL_MS,
        });
      }
    };

    const frame = ({
      stepNames,
      zoom,
      duration,
    }: {
      stepNames: string[];
      zoom: { min: number; max: number };
      duration: number;
    }) => {
      if (!isFollowing()) {
        return;
      }
      fitView({
        nodes: stepNames.map((id) => ({ id })),
        duration,
        padding: 0.35,
        minZoom: zoom.min,
        maxZoom: zoom.max,
      }).catch(() => undefined);
    };

    const isFarFrom = ({ from, to }: { from: string; to: string }) => {
      const fromNode = getNode(from);
      const toNode = getNode(to);
      if (isNil(fromNode) || isNil(toNode)) {
        return false;
      }
      const distance = Math.hypot(
        toNode.position.x - fromNode.position.x,
        toNode.position.y - fromNode.position.y,
      );
      return distance * getViewport().zoom > FAR_AWAY_PX;
    };

    const craneTo = ({
      stepName,
      zoom,
    }: {
      stepName: string;
      zoom: number;
    }) => {
      const from = lastFramedStep;
      lastFramedStep = stepName;
      const pushIn = () => {
        frame({
          stepNames: [stepName],
          zoom: { min: zoom, max: zoom },
          duration: PUSH_IN_MS,
        });
        schedule({
          fn: () =>
            lastFramedStep === stepName &&
            frame({
              stepNames: [stepName],
              zoom: { min: zoom, max: zoom },
              duration: SETTLE_MS,
            }),
          delayMs: PUSH_IN_MS + 100,
        });
      };
      const needsCrane =
        !isNil(from) && from !== stepName && isFarFrom({ from, to: stepName });
      if (!needsCrane) {
        pushIn();
        return;
      }
      frame({
        stepNames: [from],
        zoom: { min: PULL_BACK_ZOOM, max: PULL_BACK_ZOOM },
        duration: PULL_BACK_MS,
      });
      schedule({ fn: pushIn, delayMs: PULL_BACK_MS - 80 });
    };

    const openSettings = (stepName: string) => {
      const state = store.getState();
      const isAlreadyOpen =
        state.selectedStep === stepName &&
        state.rightSidebar === RightSideBarType.PIECE_SETTINGS;
      if (state.isFollowingChat && !isAlreadyOpen) {
        state.selectStepByName(stepName, { fromAutoFocus: true });
      }
    };

    const play = (shot: ChatCameraShot) => {
      const state = store.getState();
      state.setChatCameraShot(shot);
      if (!state.isFollowingChat) {
        return;
      }
      whenMeasured({
        stepName: shot.stepName,
        fn: () => {
          if (shot.kind === 'adding-after') {
            craneTo({ stepName: shot.stepName, zoom: ESTABLISH_ZOOM });
            return;
          }
          const isSettingsOpen =
            store.getState().rightSidebar === RightSideBarType.PIECE_SETTINGS;
          if (isSettingsOpen) {
            craneTo({ stepName: shot.stepName, zoom: FOCUS_ZOOM });
            schedule({
              fn: () => openSettings(shot.stepName),
              delayMs: SETTINGS_SWAP_MS,
            });
            return;
          }
          openSettings(shot.stepName);
          schedule({
            fn: () => craneTo({ stepName: shot.stepName, zoom: FOCUS_ZOOM }),
            delayMs: flowCanvasConsts.SIDEBAR_ANIMATION_DURATION + 60,
          });
        },
      });
    };

    const queuedShots: ChatCameraShot[] = [];
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
      play(next);
      schedule({ fn: playNextShot, delayMs: SHOT_DWELL_MS });
    };

    const queueShot = (shot: ChatCameraShot) => {
      const lastQueued =
        queuedShots.at(-1) ?? store.getState().chatCameraShot ?? null;
      const isRepeat =
        lastQueued?.stepName === shot.stepName &&
        lastQueued?.kind === shot.kind;
      if (isRepeat) {
        return;
      }
      queuedShots.push(shot);
      if (!isPlayingShot) {
        playNextShot();
      }
    };

    const pullBackToWideShot = () => {
      if (isPlayingShot || store.getState().isChatWaitingForUser) {
        schedule({ fn: pullBackToWideShot, delayMs: SHOT_DWELL_MS });
        return;
      }
      store.getState().setChatCameraShot(null);
      lastFramedStep = null;
      if (!isFollowing()) {
        return;
      }
      fitView({
        duration: WIDE_SHOT_DURATION_MS,
        padding: 0.15,
        minZoom: WIDE_SHOT_MIN_ZOOM,
        maxZoom: 1,
      }).catch(() => undefined);
    };

    const unsubscribe = store.subscribe((state, previous) => {
      const isWorking = state.chatActivity?.isWorking === true;
      const wasWorking = previous.chatActivity?.isWorking === true;
      if (isWorking && !wasWorking) {
        state.setFollowingChat(true);
      }
      const justStopped =
        state.chatActivity?.wasStopped === true &&
        previous.chatActivity?.wasStopped !== true;
      if (justStopped) {
        timers.forEach((id) => window.clearTimeout(id));
        timers.clear();
        queuedShots.length = 0;
        isPlayingShot = false;
        turnTailEndsAt = 0;
        pullBackToWideShot();
        return;
      }
      if (!isWorking && wasWorking) {
        turnTailEndsAt = Date.now() + TURN_TAIL_MS;
        schedule({ fn: pullBackToWideShot, delayMs: TURN_TAIL_MS });
      }

      const startedWaiting =
        state.isChatWaitingForUser && !previous.isChatWaitingForUser;
      if (startedWaiting) {
        state.setChatCameraShot(null);
      }
      const stoppedWaiting =
        !state.isChatWaitingForUser && previous.isChatWaitingForUser;
      if (stoppedWaiting && !isPlayingShot) {
        playNextShot();
      }

      const resumedFollowing =
        state.isFollowingChat && !previous.isFollowingChat;
      if (resumedFollowing && !isNil(state.chatCameraShot)) {
        play(state.chatCameraShot);
        return;
      }

      const isChatTurnLive = isWorking || Date.now() < turnTailEndsAt;
      if (!isChatTurnLive) {
        return;
      }
      pickCameraShots({ state, previous }).forEach(queueShot);
    });

    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [store, fitView, getNode, getInternalNode, getViewport]);

  return null;
}

function pickCameraShots({
  state,
  previous,
}: {
  state: BuilderState;
  previous: BuilderState;
}): ChatCameraShot[] {
  const addingAfter = newlyStarted({
    current: state.chatActivity?.addingAfterStepNames,
    before: previous.chatActivity?.addingAfterStepNames,
  }).map((stepName) => ({ stepName, kind: 'adding-after' as const }));
  const editing = newlyStarted({
    current: state.chatActivity?.editingStepNames,
    before: previous.chatActivity?.editingStepNames,
  }).map((stepName) => ({ stepName, kind: 'editing' as const }));
  const landed =
    state.recentlyChangedSteps !== previous.recentlyChangedSteps
      ? state.recentlyChangedSteps.map((stepName) => ({
          stepName,
          kind: 'editing' as const,
        }))
      : [];
  return [...addingAfter, ...editing, ...landed];
}

function newlyStarted({
  current,
  before,
}: {
  current: string[] | undefined;
  before: string[] | undefined;
}): string[] {
  return (current ?? []).filter(
    (stepName) => !(before ?? []).includes(stepName),
  );
}

const PULL_BACK_MS = 600;
const PULL_BACK_ZOOM = 0.85;
const WIDE_SHOT_MIN_ZOOM = 0.7;
const PUSH_IN_MS = 1200;
const SETTLE_MS = 400;
const SETTINGS_SWAP_MS = 1200;
const FOCUS_ZOOM = 1.15;
const ESTABLISH_ZOOM = 0.95;
const FAR_AWAY_PX = 260;
const WIDE_SHOT_DURATION_MS = 1400;
const TURN_TAIL_MS = 1500;
const SHOT_DWELL_MS = 3000;
const MEASURE_RETRIES = 20;
const MEASURE_INTERVAL_MS = 100;
