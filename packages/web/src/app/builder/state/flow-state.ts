import { isNil, tryCatch, deepEquals, prune } from '@activepieces/core-utils';
import {
  FlowAction,
  FlowOperationRequest,
  FlowOperationType,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
  flowOperations,
  flowStructureUtil,
  StepSettings,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { toast } from 'sonner';
import { StoreApi } from 'zustand';

import { RightSideBarType } from '@/app/builder/types';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import {
  PieceSelectorItem,
  PieceSelectorOperation,
  pieceSelectorUtils,
} from '@/features/pieces';
import { api } from '@/lib/api';
import { wait } from '@/lib/dom-utils';
import { KeyedDebounce } from '@/lib/keyed-debounce';
import { PromiseQueue } from '@/lib/promise-queue';

import { BuilderState } from '../builder-hooks';
import { flowCanvasUtils } from '../flow-canvas/utils/flow-canvas-utils';

export type FlowState = {
  flow: PopulatedFlow;
  flowVersion: FlowVersion;
  outputSampleData: Record<string, unknown | undefined>;
  inputSampleData: Record<string, unknown | undefined>;
  saving: boolean;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onSuccess?: () => void,
  ) => void;
  savePendingEdits: () => Promise<void>;
  flushPendingEdits: () => void;
  setFlow: (flow: PopulatedFlow) => void;
  applyDraftRefresh: (flow: PopulatedFlow) => void;
  draftRefreshCount: number;
  setSampleDataLocally: (params: {
    stepName: string;
    type: 'input' | 'output';
    value: unknown;
  }) => void;
  setVersion: (
    flowVersion: FlowVersion,
    shouldReselectInitialStep?: boolean,
  ) => void;
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
  isPublishing: boolean;
  setIsPublishing: (isPublishing: boolean) => void;
  operationListeners: Array<
    (flowVersion: FlowVersion, operation: FlowOperationRequest) => void
  >;
  handleAddingOrUpdatingStep: (props: {
    pieceSelectorItem: PieceSelectorItem;
    operation: PieceSelectorOperation;
    overrideSettings?: StepSettings;
    selectStepAfter: boolean;
    customLogoUrl?: string;
  }) => string;
};
export type FlowInitialState = Pick<
  FlowState,
  'flow' | 'flowVersion' | 'outputSampleData' | 'inputSampleData'
> & {
  queryClient: QueryClient;
};

export const createFlowState = (
  initialState: FlowInitialState,
  get: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): FlowState => {
  const flowUpdatesQueue = new PromiseQueue();
  const flowUpdatesDebounce = new KeyedDebounce({ wait: 1000, maxWait: 5000 });
  const addToFlowUpdatesQueue = (task: () => Promise<void>) => {
    flowUpdatesQueue.add(async () => {
      try {
        await task();
      } finally {
        set({
          saving:
            flowUpdatesQueue.size() !== 0 || !flowUpdatesDebounce.isEmpty(),
        });
      }
    });
  };
  const addToFlowUpdatesQueueAfterPendingEdits = (
    task: () => Promise<void>,
  ) => {
    flowUpdatesDebounce.flush();
    addToFlowUpdatesQueue(task);
  };
  return {
    saving: false,
    outputSampleData: initialState.outputSampleData,
    inputSampleData: initialState.inputSampleData,
    flow: initialState.flow,
    flowVersion: initialState.flowVersion,
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
    applyDraftRefresh: (flow: PopulatedFlow) =>
      set((state) => ({
        flow,
        flowVersion: flow.version,
        draftRefreshCount: hasSelectedStepChanged({
          selectedStep: state.selectedStep,
          currentVersion: state.flowVersion,
          refreshedVersion: flow.version,
        })
          ? state.draftRefreshCount + 1
          : state.draftRefreshCount,
      })),
    draftRefreshCount: 0,
    setSampleDataLocally: ({
      stepName,
      value,
      type,
    }: {
      stepName: string;
      value: unknown;
      type: 'input' | 'output';
    }) =>
      set((state) => {
        if (type === 'input') {
          return {
            inputSampleData: {
              ...state.inputSampleData,
              [stepName]: value,
            },
          };
        }
        return {
          outputSampleData: {
            ...state.outputSampleData,
            [stepName]: value,
          },
        };
      }),
    setIsPublishing: (isPublishing: boolean) =>
      set((state) => {
        if (isPublishing) {
          state.removeStepSelection();
          state.setReadOnly(true);
        } else {
          state.setReadOnly(false);
        }
        return {
          isPublishing,
        };
      }),
    isPublishing: false,
    applyOperation: (operation: FlowOperationRequest, onSuccess?: () => void) =>
      set((state) => {
        if (state.readonly) {
          if (operation.type === FlowOperationType.UPDATE_NOTE) {
            const newFlowVersion = flowOperations.apply(
              state.flowVersion,
              operation,
            );
            return {
              flowVersion: newFlowVersion,
            };
          }
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
        set({ saving: true });
        const updateRequest = async () => {
          try {
            const { version: serverFlowVersion } = await saveOperation({
              flowId: state.flow.id,
              operation,
            });
            if (operation.type === FlowOperationType.SAVE_SAMPLE_DATA) {
              sampleDataHooks.invalidateSampleData(
                serverFlowVersion.id,
                initialState.queryClient,
              );
            }
            set((state) => {
              const updatedFlowVersionWithUpdatedSampleData =
                handleUpdatingSampleDataForStepLocallyAfterServerUpdate({
                  operation,
                  localFlowVersion: state.flowVersion,
                  updatedFlowVersion: serverFlowVersion,
                });
              return {
                flowVersion: {
                  ...updatedFlowVersionWithUpdatedSampleData,
                  id: serverFlowVersion.id,
                  state: serverFlowVersion.state,
                },
              };
            });
            onSuccess?.();
          } catch (error) {
            console.error(error);
            showFailedSaveToast(error);
            addToFlowUpdatesQueueAfterPendingEdits(() => refetchDraft(get));
            throw error;
          }
        };

        switch (operation.type) {
          case FlowOperationType.SAVE_SAMPLE_DATA: {
            addToFlowUpdatesQueueAfterPendingEdits(updateRequest);
            break;
          }
          case FlowOperationType.UPDATE_TRIGGER:
          case FlowOperationType.UPDATE_ACTION: {
            flowUpdatesDebounce.schedule({
              key: operation.request.name,
              run: () => addToFlowUpdatesQueue(updateRequest),
            });
            break;
          }
          case FlowOperationType.UPDATE_NOTE:
          case FlowOperationType.DELETE_NOTE: {
            flowUpdatesDebounce.schedule({
              key: operation.request.id,
              run: () => addToFlowUpdatesQueue(updateRequest),
            });
            break;
          }
          case FlowOperationType.DELETE_ACTION: {
            const inputSampleData = { ...state.inputSampleData };
            const outputSampleData = { ...state.outputSampleData };
            operation.request.names.forEach((name) => {
              delete inputSampleData[name];
              delete outputSampleData[name];
              state.removeStepTestListener(name);
            });
            set(() => {
              return {
                inputSampleData,
                outputSampleData,
              };
            });
            addToFlowUpdatesQueueAfterPendingEdits(updateRequest);
            break;
          }
          default: {
            addToFlowUpdatesQueueAfterPendingEdits(updateRequest);
          }
        }

        return { flowVersion: newFlowVersion };
      }),
    savePendingEdits: async () => {
      get().flushPendingEdits();
      await flowUpdatesQueue.drain();
      if (!flowUpdatesDebounce.isEmpty()) {
        await get().savePendingEdits();
      }
    },
    flushPendingEdits: () => {
      flowUpdatesDebounce.flush();
    },
    setVersion: (
      flowVersion: FlowVersion,
      shouldReselectInitialStep: boolean = true,
    ) => {
      const initiallySelectedStep =
        flowCanvasUtils.determineInitiallySelectedStep(null, flowVersion);
      const isEmptyTriggerInitiallySelected =
        initiallySelectedStep === 'trigger' &&
        flowVersion.trigger.type === FlowTriggerType.EMPTY;
      set((state) => ({
        flowVersion,
        run: null,
        selectedStep: shouldReselectInitialStep
          ? initiallySelectedStep
          : state.selectedStep,
        readonly:
          state.flow.publishedVersionId !== flowVersion.id &&
          flowVersion.state === FlowVersionState.LOCKED,
        rightSidebar:
          initiallySelectedStep && !isEmptyTriggerInitiallySelected
            ? RightSideBarType.PIECE_SETTINGS
            : RightSideBarType.NONE,
        selectedBranchIndex: null,
      }));
    },
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
    handleAddingOrUpdatingStep: ({
      pieceSelectorItem,
      operation,
      overrideSettings,
      selectStepAfter,
      customLogoUrl,
    }): string => {
      const {
        applyOperation,
        selectStepByName,
        flowVersion,
        setOpenedPieceSelectorStepNameOrAddButtonId,
        removeStepTestListener,
      } = get();
      const defaultValues = pieceSelectorUtils.getDefaultStepValues({
        stepName: pieceSelectorUtils.getStepNameFromOperationType(
          operation,
          flowVersion,
        ),
        pieceSelectorItem,
        overrideDefaultSettings: overrideSettings,
        customLogoUrl,
      });
      const isTrigger =
        defaultValues.type === FlowTriggerType.PIECE ||
        defaultValues.type === FlowTriggerType.EMPTY;
      switch (operation.type) {
        case FlowOperationType.UPDATE_TRIGGER: {
          if (!isTrigger) {
            break;
          }
          if (flowVersion.trigger.type === FlowTriggerType.EMPTY) {
            set(() => {
              return {
                rightSidebar: RightSideBarType.PIECE_SETTINGS,
              };
            });
          }
          applyOperation({
            type: FlowOperationType.UPDATE_TRIGGER,
            request: defaultValues,
          });
          selectStepByName('trigger');
          applyOperation({
            type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
            request: {
              stepName: 'trigger',
              sampleDataSettings: undefined,
            },
          });
          break;
        }
        case FlowOperationType.ADD_ACTION: {
          if (isTrigger) {
            break;
          }
          applyOperation({
            type: FlowOperationType.ADD_ACTION,
            request: {
              ...operation.actionLocation,
              action: {
                ...defaultValues,
              },
            },
          });
          if (selectStepAfter) {
            selectStepByName(defaultValues.name);
          }
          break;
        }
        case FlowOperationType.UPDATE_ACTION: {
          const currentAction = flowStructureUtil.getStep(
            operation.stepName,
            flowVersion.trigger,
          );
          if (isNil(currentAction)) {
            console.error(
              "Trying to update an action that's not in the displayed flow version",
            );
            break;
          }
          if (
            !flowStructureUtil.isAction(currentAction.type) ||
            !flowStructureUtil.isAction(defaultValues.type)
          ) {
            break;
          }
          applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: {
              type: defaultValues.type,
              displayName: defaultValues.displayName,
              name: operation.stepName,
              settings: {
                ...defaultValues.settings,
                customLogoUrl,
              },
              valid: defaultValues.valid,
            },
          });
          applyOperation({
            type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
            request: {
              stepName: operation.stepName,
              sampleDataSettings: undefined,
            },
          });
          removeStepTestListener(operation.stepName);
          break;
        }
      }
      setOpenedPieceSelectorStepNameOrAddButtonId(null);
      return defaultValues.name;
    },
  };
};

async function refetchDraft(get: StoreApi<BuilderState>['getState']) {
  const { flow, setFlow, setVersion } = get();
  const { data: serverFlow, error } = await tryCatch(() =>
    failAfterTimeout(() => flowsApi.get(flow.id)),
  );
  if (error !== null) {
    internalErrorToast();
    throw error;
  }
  setFlow(serverFlow);
  setVersion(serverFlow.version);
}

function saveOperation({
  flowId,
  operation,
}: {
  flowId: string;
  operation: FlowOperationRequest;
}): Promise<PopulatedFlow> {
  return sendWithRetries({
    send: () => failAfterTimeout(() => flowsApi.update(flowId, operation)),
    retryDelaysMs: IDEMPOTENT_OPERATION_TYPES.includes(operation.type)
      ? SAVE_RETRY_DELAYS_MS
      : [],
  });
}

async function sendWithRetries({
  send,
  retryDelaysMs,
}: {
  send: () => Promise<PopulatedFlow>;
  retryDelaysMs: number[];
}): Promise<PopulatedFlow> {
  const { data: savedFlow, error } = await tryCatch(send);
  if (error === null) {
    return savedFlow;
  }
  const [delayMs, ...laterDelaysMs] = retryDelaysMs;
  if (isNil(delayMs) || !isTransientSaveError(error)) {
    throw error;
  }
  await wait(delayMs);
  return sendWithRetries({ send, retryDelaysMs: laterDelaysMs });
}

async function failAfterTimeout<T>(send: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new AxiosError(
            `timeout of ${FLOW_REQUEST_TIMEOUT_MS}ms exceeded`,
            AxiosError.ETIMEDOUT,
          ),
        ),
      FLOW_REQUEST_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([send(), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

function isTransientSaveError(error: unknown) {
  if (!api.isError(error)) {
    return false;
  }
  if (isNil(error.response)) {
    return true;
  }
  const { status } = error.response;
  return (
    status === api.httpStatus.RequestTimeout ||
    status === api.httpStatus.TooManyRequests ||
    status >= api.httpStatus.InternalServerError
  );
}

function showFailedSaveToast(error: unknown) {
  toast.error(t('Your change was not saved'), {
    id: 'failed-flow-save',
    description:
      api.serverErrorMessage(error) ??
      t('The builder now shows the last saved version of the flow.'),
  });
}

/**Because the server creates the sample data files ids and we need to update the local flow version with the new sample data files ids so when an update happens again in the future it doesn't get unset */
const handleUpdatingSampleDataForStepLocallyAfterServerUpdate = ({
  operation,
  localFlowVersion,
  updatedFlowVersion,
}: {
  operation: FlowOperationRequest;
  localFlowVersion: FlowVersion;
  updatedFlowVersion: FlowVersion;
}) => {
  if (operation.type !== FlowOperationType.SAVE_SAMPLE_DATA) {
    return localFlowVersion;
  }
  const localStep = flowStructureUtil.getStep(
    operation.request.stepName,
    localFlowVersion.trigger,
  );
  const updatedStep = flowStructureUtil.getStep(
    operation.request.stepName,
    updatedFlowVersion.trigger,
  );
  if (isNil(localStep) || isNil(updatedStep)) {
    console.error(`Step ${operation.request.stepName} not found`);
    return localFlowVersion;
  }
  return flowOperations.apply(localFlowVersion, {
    type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
    request: {
      stepName: operation.request.stepName,
      sampleDataSettings: updatedStep.settings.sampleData,
    },
  });
};

function hasSelectedStepChanged({
  selectedStep,
  currentVersion,
  refreshedVersion,
}: {
  selectedStep: string | null;
  currentVersion: FlowVersion;
  refreshedVersion: FlowVersion;
}): boolean {
  if (isNil(selectedStep)) {
    return false;
  }
  return !deepEquals({
    a: stepFormContent(
      flowStructureUtil.getStep(selectedStep, currentVersion.trigger),
    ),
    b: stepFormContent(
      flowStructureUtil.getStep(selectedStep, refreshedVersion.trigger),
    ),
  });
}

function stepFormContent(step: FlowAction | FlowTrigger | undefined) {
  if (isNil(step)) {
    return undefined;
  }
  const { sampleData: _, ...settings } = step.settings;
  return prune({
    type: step.type,
    displayName: step.displayName,
    skip: 'skip' in step ? step.skip : undefined,
    settings,
  });
}

const SAVE_RETRY_DELAYS_MS = [1000, 2000, 4000];

const FLOW_REQUEST_TIMEOUT_MS = 60_000;

const IDEMPOTENT_OPERATION_TYPES = [
  FlowOperationType.UPDATE_ACTION,
  FlowOperationType.UPDATE_TRIGGER,
  FlowOperationType.UPDATE_NOTE,
  FlowOperationType.CHANGE_NAME,
  FlowOperationType.SET_SKIP_ACTION,
  FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
  FlowOperationType.IMPORT_FLOW,
];
