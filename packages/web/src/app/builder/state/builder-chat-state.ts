import { deepEquals, isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  flowStepDiff,
  FlowToolTarget,
  FlowVersionState,
  PopulatedFlow,
  flowStructureUtil,
} from '@activepieces/shared';
import { StoreApi } from 'zustand';

import { ChatFlowActivity } from '@/features/chat/lib/chat-flow-activity';

import { BuilderState } from '../builder-hooks';
import { RightSideBarType } from '../types';

import { StepDataPanelView } from './canvas-state';

const OPEN_STORAGE_KEY = 'builder-chat-panel-open';
const COACHMARK_SEEN_STORAGE_KEY = 'builder-chat-coachmark-seen';
const HIGHLIGHT_DURATION_MS = 4000;
const NOT_FORM_FIELDS = new Set(['displayName', 'type', 'skip']);

export const createBuilderChatState = (
  get: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): BuilderChatState => {
  return {
    isBuilderChatOpen: readStorage(OPEN_STORAGE_KEY) === 'true',
    setBuilderChatOpen: (open: boolean) => {
      writeStorage({ key: OPEN_STORAGE_KEY, value: String(open) });
      const showCoachmark =
        !open && readStorage(COACHMARK_SEEN_STORAGE_KEY) !== 'true';
      set({ isBuilderChatOpen: open, isChatCoachmarkVisible: showCoachmark });
    },
    isChatCoachmarkVisible: false,
    chatCameraShot: null,
    setChatCameraShot: (shot: ChatCameraShot | null) =>
      set({ chatCameraShot: shot }),
    isChatWaitingForUser: false,
    setChatWaitingForUser: (waiting: boolean) =>
      set({ isChatWaitingForUser: waiting }),
    isFollowingChat: true,
    setFollowingChat: (following: boolean) =>
      set({ isFollowingChat: following }),
    dismissChatCoachmark: () => {
      writeStorage({ key: COACHMARK_SEEN_STORAGE_KEY, value: 'true' });
      set({ isChatCoachmarkVisible: false });
    },
    recentlyChangedSteps: [],
    recentlyAddedSteps: [],
    recentlyChangedFields: {},
    remoteRevision: 0,
    chatActivity: null,
    setChatActivity: (activity: ChatFlowActivity) => {
      if (!deepEquals({ a: get().chatActivity, b: activity })) {
        set({ chatActivity: activity });
      }
    },
    applyRemoteFlow: (flow: PopulatedFlow) => {
      const state = get();
      const isStale =
        state.saving ||
        state.flow.id !== flow.id ||
        state.flowVersion.updated === flow.version.updated;
      if (isStale) {
        return;
      }
      const changes = flowStepDiff.diff({
        before: flowStepDiff.takeSnapshot({
          trigger: state.flowVersion.trigger,
          versionId: state.flowVersion.id,
        }),
        after: flowStepDiff.takeSnapshot({
          trigger: flow.version.trigger,
          versionId: flow.version.id,
        }),
      });
      const changedStepNames = changes
        .filter((change) => change.kind !== 'removed')
        .map((change) => change.stepName);
      const changedFieldNames = Object.fromEntries(
        changes.map((change) => [
          change.stepName,
          change.fields.flatMap((field) => formFieldName(field.path)),
        ]),
      );
      const addedStepNames = changes
        .filter((change) => change.kind === 'added')
        .map((change) => change.stepName);
      const selectedStepStillExists =
        state.selectedStep !== null &&
        flowStructureUtil.getStep(state.selectedStep, flow.version.trigger) !==
          undefined;
      const selectedStepChanged =
        state.selectedStep !== null &&
        changes.some((change) => change.stepName === state.selectedStep);
      set({
        flow,
        flowVersion: flow.version,
        readonly:
          flow.publishedVersionId !== flow.version.id &&
          flow.version.state === FlowVersionState.LOCKED,
        selectedStep: selectedStepStillExists ? state.selectedStep : null,
        run: changes.length > 0 ? null : state.run,
        rightSidebar:
          !selectedStepStillExists &&
          state.rightSidebar === RightSideBarType.PIECE_SETTINGS
            ? RightSideBarType.NONE
            : state.rightSidebar,
        recentlyChangedSteps: changedStepNames,
        recentlyAddedSteps: addedStepNames,
        recentlyChangedFields: changedFieldNames,
        remoteRevision: selectedStepChanged
          ? state.remoteRevision + 1
          : state.remoteRevision,
      });
      if (changedStepNames.length > 0) {
        setTimeout(() => {
          if (get().recentlyChangedSteps === changedStepNames) {
            set({
              recentlyChangedSteps: [],
              recentlyAddedSteps: [],
              recentlyChangedFields: {},
            });
          }
        }, HIGHLIGHT_DURATION_MS);
      }
    },
  };
};

function formFieldName(diffPath: string): string[] {
  if (NOT_FORM_FIELDS.has(diffPath)) {
    return [];
  }
  return [`settings.${diffPath}`];
}

function readStorage(key: string): string | null {
  return tryCatchSync(() => localStorage.getItem(key)).data ?? null;
}

function writeStorage({ key, value }: { key: string; value: string }): void {
  tryCatchSync(() => localStorage.setItem(key, value));
}

function effectiveStepDataPanelView(state: BuilderState): StepDataPanelView {
  return state.isBuilderChatOpen ? 'drawer' : state.stepDataPanelView;
}

function cameraStepName(state: BuilderState): string | null {
  const shot = state.chatCameraShot;
  return isNil(shot) || shot.kind === 'testing-flow' ? null : shot.stepName;
}

export const builderChatSelectors = {
  effectiveStepDataPanelView,
  cameraStepName,
};

export type ChatCameraShot = FlowToolTarget;

export type BuilderChatState = {
  isBuilderChatOpen: boolean;
  setBuilderChatOpen: (open: boolean) => void;
  isChatCoachmarkVisible: boolean;
  dismissChatCoachmark: () => void;
  chatCameraShot: ChatCameraShot | null;
  setChatCameraShot: (shot: ChatCameraShot | null) => void;
  isChatWaitingForUser: boolean;
  setChatWaitingForUser: (waiting: boolean) => void;
  isFollowingChat: boolean;
  setFollowingChat: (following: boolean) => void;
  recentlyChangedSteps: string[];
  recentlyAddedSteps: string[];
  recentlyChangedFields: Record<string, string[]>;
  remoteRevision: number;
  chatActivity: ChatFlowActivity | null;
  setChatActivity: (activity: ChatFlowActivity) => void;
  applyRemoteFlow: (flow: PopulatedFlow) => void;
};
