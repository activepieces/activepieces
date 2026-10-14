import {
  flowStepDiff,
  FlowVersionState,
  PopulatedFlow,
  flowStructureUtil,
} from '@activepieces/shared';
import { StoreApi } from 'zustand';

import { BuilderState } from '../builder-hooks';

const OPEN_STORAGE_KEY = 'builder-chat-panel-open';
const HIGHLIGHT_DURATION_MS = 2500;

export const createBuilderChatState = (
  get: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): BuilderChatState => {
  return {
    isBuilderChatOpen: readStoredOpen(),
    setBuilderChatOpen: (open: boolean) => {
      writeStoredOpen(open);
      set({ isBuilderChatOpen: open });
    },
    recentlyChangedSteps: [],
    remoteRevision: 0,
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
        recentlyChangedSteps: changedStepNames,
        remoteRevision: selectedStepChanged
          ? state.remoteRevision + 1
          : state.remoteRevision,
      });
      if (changedStepNames.length > 0) {
        setTimeout(() => {
          if (get().recentlyChangedSteps === changedStepNames) {
            set({ recentlyChangedSteps: [] });
          }
        }, HIGHLIGHT_DURATION_MS);
      }
    },
  };
};

function readStoredOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredOpen(open: boolean): void {
  try {
    localStorage.setItem(OPEN_STORAGE_KEY, String(open));
  } catch {
    return;
  }
}

export type BuilderChatState = {
  isBuilderChatOpen: boolean;
  setBuilderChatOpen: (open: boolean) => void;
  recentlyChangedSteps: string[];
  remoteRevision: number;
  applyRemoteFlow: (flow: PopulatedFlow) => void;
};
