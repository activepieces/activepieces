import dayjs from 'dayjs';
import { StoreApi } from 'zustand';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { PromiseQueue } from '@/lib/promise-queue';
import {
  PieceSelectorItem,
  PieceSelectorOperation,
  RightSideBarType,
} from '@/lib/types';
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

import { BuilderState } from '../builder-hooks';
import { flowCanvasUtils } from '../flow-canvas/utils/flow-canvas-utils';

export type FlowState = {
  flow: PopulatedFlow;
  flowVersion: FlowVersion;
  outputSampleData: Record<string, unknown>;
  inputSampleData: Record<string, unknown>;
  saving: boolean;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onSuccess?: () => void,
  ) => void;
  setFlow: (flow: PopulatedFlow) => void;
  setSampleData: (params: {
    stepName: string;
    type: 'input' | 'output';
    value: unknown;
  }) => void;
  setVersion: (flowVersion: FlowVersion) => void;
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
>;

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
    setSampleData: ({
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
          console.warn('Cannot apply operation while readonly');
          return state;
        }
        let newFlowVersion = flowOperations.apply(state.flowVersion, operation);

        state.operationListeners.forEach((listener) => {
          listener(state.flowVersion, operation);
        });
        set({ saving: true });
        const updateRequest = async () => {
          try {
            const updatedFlowVersion = await flowsApi.update(
              state.flow.id,
              operation,
              true,
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
            onSuccess?.();
          } catch (error) {
            console.error(error);
            flowUpdatesQueue.halt();
          }
        };

        switch (operation.type) {
          case FlowOperationType.SAVE_SAMPLE_DATA: {
            flowUpdatesQueue.add(updateRequest);
            const step = flowStructureUtil.getStep(
              operation.request.stepName,
              newFlowVersion.trigger,
            );
            if (isNil(step)) {
              console.error(`Step ${operation.request.stepName} not found`);
              return state;
            }
            step.settings.sampleData = {
              ...step.settings.sampleData,
              lastTestDate: dayjs().toISOString(),
            };
            if (
              step.type === FlowTriggerType.PIECE ||
              step.type === FlowTriggerType.EMPTY
            ) {
              newFlowVersion = flowOperations.apply(newFlowVersion, {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: step,
              });
            } else {
              newFlowVersion = flowOperations.apply(newFlowVersion, {
                type: FlowOperationType.UPDATE_ACTION,
                request: step,
              });
            }

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
          default: {
            flowUpdatesQueue.add(updateRequest);
          }
        }

        return { flowVersion: newFlowVersion };
      }),
    setVersion: (flowVersion: FlowVersion) => {
      const initiallySelectedStep =
        flowCanvasUtils.determineInitiallySelectedStep(null, flowVersion);
      const isEmptyTriggerInitiallySelected =
        initiallySelectedStep === 'trigger' &&
        flowVersion.trigger.type === FlowTriggerType.EMPTY;
      set((state) => ({
        flowVersion,
        run: null,
        selectedStep: initiallySelectedStep,
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
          break;
        }
      }
      setOpenedPieceSelectorStepNameOrAddButtonId(null);
      return defaultValues.name;
    },
  };
};
