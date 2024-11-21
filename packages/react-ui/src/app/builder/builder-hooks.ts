import { useMutation } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { create, useStore } from 'zustand';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PromiseQueue } from '@/lib/promise-queue';
import {
  FlowOperationRequest,
  FlowRun,
  FlowVersion,
  FlowVersionState,
  Permission,
  PopulatedFlow,
  TriggerType,
  flowOperations,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';

import { flowRunUtils } from '../../features/flow-runs/lib/flow-run-utils';
import { useAuthorization } from '../../hooks/authorization-hooks';

const flowUpdatesQueue = new PromiseQueue();

export const BuilderStateContext = createContext<BuilderStore | null>(null);

export function useBuilderStateContext<T>(
  selector: (state: BuilderState) => T,
): T {
  const store = useContext(BuilderStateContext);
  if (!store)
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  return useStore(store, selector);
}

export enum LeftSideBarType {
  RUNS = 'runs',
  VERSIONS = 'versions',
  RUN_DETAILS = 'run-details',
  AI_COPILOT = 'chat',
  NONE = 'none',
}

export enum RightSideBarType {
  NONE = 'none',
  PIECE_SETTINGS = 'piece-settings',
}

type InsertMentionHandler = (propertyPath: string) => void;
export type BuilderState = {
  flow: PopulatedFlow;
  flowVersion: FlowVersion;
  readonly: boolean;
  sampleData: Record<string, unknown>;
  loopsIndexes: Record<string, number>;
  run: FlowRun | null;
  leftSidebar: LeftSideBarType;
  rightSidebar: RightSideBarType;
  selectedStep: string | null;
  canExitRun: boolean;
  activeDraggingStep: string | null;
  allowCanvasPanning: boolean;
  saving: boolean;
  refreshPieceFormSettings: boolean;
  selectedBranchIndex: number | null;
  refreshSettings: () => void;
  setSelectedBranchIndex: (index: number | null) => void;
  exitRun: (userHasPermissionToEditFlow: boolean) => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onError: () => void,
  ) => void;
  removeStepSelection: () => void;
  selectStepByName: (stepName: string) => void;
  startSaving: () => void;
  setAllowCanvasPanning: (allowCanvasPanning: boolean) => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  setFlow: (flow: PopulatedFlow) => void;
  setSampleData: (stepName: string, payload: unknown) => void;
  exitPieceSelector: () => void;
  setVersion: (flowVersion: FlowVersion) => void;
  insertMention: InsertMentionHandler | null;
  setReadOnly: (readOnly: boolean) => void;
  setInsertMentionHandler: (handler: InsertMentionHandler | null) => void;
  setLoopIndex: (stepName: string, index: number) => void;
  operationListeners: Array<
    (flowVersion: FlowVersion, operation: FlowOperationRequest) => void
  >;
  addOperationListener: (
    listener: (
      flowVersion: FlowVersion,
      operation: FlowOperationRequest,
    ) => void,
  ) => void;
  removeOperationListener: (
    listener: (
      flowVersion: FlowVersion,
      operation: FlowOperationRequest,
    ) => void,
  ) => void;
};

export type BuilderInitialState = Pick<
  BuilderState,
  'flow' | 'flowVersion' | 'readonly' | 'run' | 'canExitRun' | 'sampleData'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;

function determineInitiallySelectedStep(
  failedStepInRun: string | null,
  flowVersion: FlowVersion,
): string | null {
  if (failedStepInRun) {
    return failedStepInRun;
  }
  if (flowVersion.state === FlowVersionState.LOCKED) {
    return null;
  }
  return (
    flowStructureUtil.getAllSteps(flowVersion.trigger).find((s) => !s.valid)
      ?.name ?? 'trigger'
  );
}

export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set) => {
    const failedStepInRun = initialState.run?.steps
      ? flowRunUtils.findFailedStepInOutput(initialState.run.steps)
      : null;
    const initiallySelectedStep = determineInitiallySelectedStep(
      failedStepInRun,
      initialState.flowVersion,
    );
    return {
      loopsIndexes:
        initialState.run && initialState.run.steps
          ? flowRunUtils.findLoopsState(
              initialState.flowVersion,
              initialState.run,
              {},
            )
          : {},
      sampleData: initialState.sampleData,
      flow: initialState.flow,
      flowVersion: initialState.flowVersion,
      leftSidebar: initialState.run
        ? LeftSideBarType.RUN_DETAILS
        : LeftSideBarType.NONE,
      readonly: initialState.readonly,
      run: initialState.run,
      saving: false,
      selectedStep: initiallySelectedStep,
      canExitRun: initialState.canExitRun,
      activeDraggingStep: null,
      allowCanvasPanning: true,
      rightSidebar:
        initiallySelectedStep &&
        (initiallySelectedStep !== 'trigger' ||
          initialState.flowVersion.trigger.type !== TriggerType.EMPTY)
          ? RightSideBarType.PIECE_SETTINGS
          : RightSideBarType.NONE,
      refreshPieceFormSettings: false,

      removeStepSelection: () =>
        set({
          selectedStep: null,
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
        }),
      setAllowCanvasPanning: (allowCanvasPanning: boolean) =>
        set({
          allowCanvasPanning,
        }),
      setActiveDraggingStep: (stepName: string | null) =>
        set({
          activeDraggingStep: stepName,
        }),
      setSelectedBranchIndex: (branchIndex: number | null) =>
        set({
          selectedBranchIndex: branchIndex,
        }),
      setReadOnly: (readonly: boolean) => set({ readonly }),
      renameFlowClientSide: (newName: string) => {
        set((state) => {
          return {
            flowVersion: {
              ...state.flowVersion,
              displayName: newName,
            },
          };
        });
      },
      selectStepByName: (stepName: string) => {
        set((state) => {
          return {
            selectedStep: stepName,
            rightSidebar:
              stepName === 'trigger' &&
              state.flowVersion.trigger.type === TriggerType.EMPTY
                ? RightSideBarType.NONE
                : RightSideBarType.PIECE_SETTINGS,
            leftSidebar: !isNil(state.run)
              ? LeftSideBarType.RUN_DETAILS
              : LeftSideBarType.NONE,
            selectedBranchIndex: null,
          };
        });
      },
      moveToFolderClientSide: (folderId: string) => {
        set((state) => {
          return {
            flow: {
              ...state.flow,
              folderId,
            },
          };
        });
      },
      setFlow: (flow: PopulatedFlow) => set({ flow, selectedStep: null }),
      setSampleData: (stepName: string, payload: unknown) =>
        set((state) => {
          return {
            sampleData: {
              ...state.sampleData,
              [stepName]: payload,
            },
          };
        }),
      exitRun: (userHasPermissionToEditFlow: boolean) =>
        set({
          run: null,
          readonly: !userHasPermissionToEditFlow,
          loopsIndexes: {},
          leftSidebar: LeftSideBarType.NONE,
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
        }),
      exitStepSettings: () =>
        set({
          rightSidebar: RightSideBarType.NONE,
          selectedStep: null,
          selectedBranchIndex: null,
        }),
      exitPieceSelector: () =>
        set({
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
        }),
      setRightSidebar: (rightSidebar: RightSideBarType) =>
        set({ rightSidebar }),
      setLeftSidebar: (leftSidebar: LeftSideBarType) => set({ leftSidebar }),
      setRun: async (run: FlowRun, flowVersion: FlowVersion) =>
        set((state) => {
          return {
            loopsIndexes: flowRunUtils.findLoopsState(
              flowVersion,
              run,
              state.loopsIndexes,
            ),
            run,
            flowVersion,
            leftSidebar: LeftSideBarType.RUN_DETAILS,
            rightSidebar: RightSideBarType.PIECE_SETTINGS,
            selectedStep: run.steps
              ? flowRunUtils.findFailedStepInOutput(run.steps) ??
                state.selectedStep ??
                'trigger'
              : 'trigger',
            readonly: true,
          };
        }),
      startSaving: () => set({ saving: true }),
      setLoopIndex: (stepName: string, index: number) => {
        set((state) => {
          return {
            loopsIndexes: {
              ...state.loopsIndexes,
              [stepName]: index,
            },
          };
        });
      },
      applyOperation: (operation: FlowOperationRequest, onError: () => void) =>
        set((state) => {
          if (state.readonly) {
            console.warn('Cannot apply operation while readonly');
            return state;
          }
          const newFlowVersion = flowOperations.apply(
            state.flowVersion,
            operation,
          );

          state.operationListeners.forEach((listener) => {
            listener(state.flowVersion, operation);
          });

          const updateRequest = async () => {
            set({ saving: true });
            try {
              const updatedFlowVersion = await flowsApi.update(
                state.flow.id,
                operation,
              );
              set((state) => {
                return {
                  flowVersion: {
                    ...state.flowVersion,
                    id: updatedFlowVersion.version.id,
                    state: updatedFlowVersion.version.state,
                  },
                  saving: flowUpdatesQueue.size() !== 0,
                };
              });
            } catch (error) {
              console.error(error);
              flowUpdatesQueue.halt();
              onError();
            }
          };
          flowUpdatesQueue.add(updateRequest);
          return { flowVersion: newFlowVersion };
        }),
      setVersion: (flowVersion: FlowVersion) => {
        set((state) => ({
          flowVersion,
          run: null,
          selectedStep: null,
          readonly:
            state.flow.publishedVersionId !== flowVersion.id &&
            flowVersion.state === FlowVersionState.LOCKED,
          leftSidebar: LeftSideBarType.NONE,
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
        }));
      },
      insertMention: null,
      setInsertMentionHandler: (insertMention: InsertMentionHandler | null) => {
        set({ insertMention });
      },
      refreshSettings: () =>
        set((state) => ({
          refreshPieceFormSettings: !state.refreshPieceFormSettings,
        })),
      selectedBranchIndex: null,
      operationListeners: [],
      addOperationListener: (
        listener: (
          flowVersion: FlowVersion,
          operation: FlowOperationRequest,
        ) => void,
      ) =>
        set((state) => ({
          operationListeners: [...state.operationListeners, listener],
        })),
      removeOperationListener: (
        listener: (
          flowVersion: FlowVersion,
          operation: FlowOperationRequest,
        ) => void,
      ) =>
        set((state) => ({
          operationListeners: state.operationListeners.filter(
            (l) => l !== listener,
          ),
        })),
    };
  });

export const useSwitchToDraft = () => {
  const [flowVersion, setVersion, exitRun] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.setVersion,
    state.exitRun,
  ]);
  const { checkAccess } = useAuthorization();
  const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    useMutation({
      mutationFn: async () => {
        const flow = await flowsApi.get(flowVersion.flowId);
        return flow;
      },
      onSuccess: (flow) => {
        setVersion(flow.version);
        exitRun(userHasPermissionToEditFlow);
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
};
