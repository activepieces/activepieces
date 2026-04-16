import {
  FlowOperationRequest,
  FlowOperationType,
  FlowVersion,
  FlowVersionState,
  PopulatedFlow,
  flowOperations,
  flowStructureUtil,
  isNil,
  StepSettings,
  FlowTriggerType,
  debounce,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { StoreApi } from 'zustand';

import { RightSideBarType } from '@/app/builder/types';
import { flowsApi, sampleDataHooks } from '@/features/flows';
import {
  PieceSelectorItem,
  PieceSelectorOperation,
  pieceSelectorUtils,
} from '@/features/pieces';
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
  setFlow: (flow: PopulatedFlow) => void;
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
  const debouncedAddToFlowUpdatesQueue = debounce(
    (updateRequest: () => Promise<void>) => {
      flowUpdatesQueue.add(updateRequest);
    },
    1000,
  );
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
            const { version: serverFlowVersion } = await flowsApi.update(
              state.flow.id,
              operation,
              true,
            );
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
                saving: flowUpdatesQueue.size() !== 0,
              };
            });
            onSuccess?.();
          } catch (error) {
            console.error(error);
            flowUpdatesQueue.halt();
          }
        };

        switch (operation.type) {
          case FlowOperationType.SAVE_SAMPLE_DATA: {
            flowUpdatesQueue.add(updateRequest);
            break;
          }
          case FlowOperationType.UPDATE_TRIGGER:
          case FlowOperationType.UPDATE_ACTION: {
            debouncedAddToFlowUpdatesQueue(
              operation.request.name,
              updateRequest,
            );
            break;
          }
          case FlowOperationType.UPDATE_NOTE:
          case FlowOperationType.DELETE_NOTE:
          case FlowOperationType.ADD_NOTE: {
            debouncedAddToFlowUpdatesQueue(operation.request.id, updateRequest);
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
            flowUpdatesQueue.add(updateRequest);
            break;
          }
          default: {
            flowUpdatesQueue.add(updateRequest);
          }
        }

        return { flowVersion: newFlowVersion };
      }),
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
