import { useMutation } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { usePrevious } from 'react-use';
import { create, useStore } from 'zustand';

import { Messages } from '@/components/ui/chat/chat-message-list';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PromiseQueue } from '@/lib/promise-queue';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
import {
  FlowOperationRequest,
  FlowOperationType,
  FlowRun,
  FlowVersion,
  FlowVersionState,
  Permission,
  PopulatedFlow,
  flowOperations,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
  FlowRunStatus,
  apId,
  StepSettings,
  FlowTriggerType,
  FlowActionType,
  LoopStepOutput,
} from '@activepieces/shared';

import { flowRunUtils } from '../../features/flow-runs/lib/flow-run-utils';
import { pieceSelectorUtils } from '../../features/pieces/lib/piece-selector-utils';
import { useAuthorization } from '../../hooks/authorization-hooks';
import {
  AskAiButtonOperations,
  PieceSelectorItem,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '../../lib/types';

import {
  copySelectedNodes,
  deleteSelectedNodes,
  getActionsInClipboard,
  pasteNodes,
  toggleSkipSelectedNodes,
} from './flow-canvas/bulk-actions';
import {
  CanvasShortcuts,
  CanvasShortcutsProps,
} from './flow-canvas/context-menu/canvas-context-menu';
import { STEP_CONTEXT_MENU_ATTRIBUTE } from './flow-canvas/utils/consts';
import { flowCanvasUtils } from './flow-canvas/utils/flow-canvas-utils';
import { textMentionUtils } from './piece-properties/text-input-with-mentions/text-input-utils';
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

export enum ChatDrawerSource {
  TEST_FLOW = 'test-flow',
  TEST_STEP = 'test-step',
}

type InsertMentionHandler = (propertyPath: string) => void;
export type BuilderState = {
  flow: PopulatedFlow;
  flowVersion: FlowVersion;
  readonly: boolean;
  sampleData: Record<string, unknown>;
  sampleDataInput: Record<string, unknown>;
  loopsIndexes: Record<string, number>;
  run: FlowRun | null;
  leftSidebar: LeftSideBarType;
  rightSidebar: RightSideBarType;
  selectedStep: string | null;
  canExitRun: boolean;
  activeDraggingStep: string | null;
  saving: boolean;
  /** change this value to trigger the step form to set its values from the step */
  refreshStepFormSettingsToggle: boolean;
  selectedBranchIndex: number | null;
  chatDrawerOpenSource: ChatDrawerSource | null;
  chatSessionMessages: Messages;
  chatSessionId: string | null;
  setChatDrawerOpenSource: (source: ChatDrawerSource | null) => void;
  setChatSessionMessages: (messages: Messages) => void;
  addChatMessage: (message: Messages[0]) => void;
  clearChatSession: () => void;
  setChatSessionId: (sessionId: string | null) => void;
  refreshSettings: () => void;
  setSelectedBranchIndex: (index: number | null) => void;
  clearRun: (userHasPermissionToEditFlow: boolean) => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onSuccess?: () => void,
  ) => void;
  removeStepSelection: () => void;
  selectStepByName: (stepName: string) => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  setFlow: (flow: PopulatedFlow) => void;
  setSampleData: (stepName: string, payload: unknown) => void;
  setSampleDataInput: (stepName: string, payload: unknown) => void;
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
  askAiButtonProps: AskAiButtonOperations | null;
  setAskAiButtonProps: (props: AskAiButtonOperations | null) => void;
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
  panningMode: 'grab' | 'pan';
  setPanningMode: (mode: 'grab' | 'pan') => void;
  isFocusInsideListMapperModeInput: boolean;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  isPublishing: boolean;
  setIsPublishing: (isPublishing: boolean) => void;
  handleAddingOrUpdatingStep: (props: {
    pieceSelectorItem: PieceSelectorItem;
    operation: PieceSelectorOperation;
    overrideSettings?: StepSettings;
    selectStepAfter: boolean;
    customLogoUrl?: string;
  }) => string;
  deselectStep: () => void;
  //Piece selector state
  openedPieceSelectorStepNameOrAddButtonId: string | null;
  setOpenedPieceSelectorStepNameOrAddButtonId: (
    stepNameOrAddButtonId: string | null,
  ) => void;
  selectedPieceMetadataInPieceSelector: StepMetadataWithSuggestions | null;
  setSelectedPieceMetadataInPieceSelector: (
    metadata: StepMetadataWithSuggestions | null,
  ) => void;
  /**Need this to re-render the piece settings form on replace step or updating agent */
  lastRerenderPieceSettingsTimeStamp: number | null;
  setLastRerenderPieceSettingsTimeStamp: (timestamp: number) => void;
};
const DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE = 'defaultPanningMode';
export type BuilderInitialState = Pick<
  BuilderState,
  | 'flow'
  | 'flowVersion'
  | 'readonly'
  | 'run'
  | 'canExitRun'
  | 'sampleData'
  | 'sampleDataInput'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;

export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set, get) => {
    const failedStepNameInRun = initialState.run?.steps
      ? flowRunUtils.findLastStepWithStatus(
          initialState.run.status,
          initialState.run.steps,
        )
      : null;
    const initiallySelectedStep = determineInitiallySelectedStep(
      failedStepNameInRun,
      initialState.flowVersion,
    );
    const isEmptyTriggerInitiallySelected =
      initiallySelectedStep === 'trigger' &&
      initialState.flowVersion.trigger.type === FlowTriggerType.EMPTY;
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
      sampleDataInput: initialState.sampleDataInput,
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
      rightSidebar:
        initiallySelectedStep && !isEmptyTriggerInitiallySelected
          ? RightSideBarType.PIECE_SETTINGS
          : RightSideBarType.NONE,
      refreshStepFormSettingsToggle: false,
      chatDrawerOpenSource: null,
      chatSessionMessages: [],
      chatSessionId: apId(),
      setChatDrawerOpenSource: (source: ChatDrawerSource | null) =>
        set({ chatDrawerOpenSource: source }),
      setChatSessionMessages: (messages: Messages) =>
        set({ chatSessionMessages: messages }),
      addChatMessage: (message: Messages[0]) =>
        set((state) => ({
          chatSessionMessages: [...state.chatSessionMessages, message],
        })),
      clearChatSession: () =>
        set({ chatSessionMessages: [], chatSessionId: null }),
      setChatSessionId: (sessionId: string | null) =>
        set({ chatSessionId: sessionId }),
      removeStepSelection: () =>
        set({
          selectedStep: null,
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
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
      selectStepByName: (selectedStep: string) => {
        set((state) => {
          if (selectedStep === state.selectedStep) {
            return state;
          }
          const selectedNodes =
            isNil(selectedStep) || selectedStep === 'trigger'
              ? []
              : [selectedStep];

          const rightSidebar =
            selectedStep === 'trigger' &&
            state.flowVersion.trigger.type === FlowTriggerType.EMPTY
              ? RightSideBarType.NONE
              : RightSideBarType.PIECE_SETTINGS;

          const leftSidebar = !isNil(state.run)
            ? LeftSideBarType.RUN_DETAILS
            : LeftSideBarType.NONE;

          const isEmptyTrigger =
            selectedStep === 'trigger' &&
            state.flowVersion.trigger.type === FlowTriggerType.EMPTY;

          return {
            openedPieceSelectorStepNameOrAddButtonId: isEmptyTrigger
              ? 'trigger'
              : null,
            selectedStep,
            rightSidebar,
            leftSidebar,
            selectedBranchIndex: null,
            askAiButtonProps: null,
            selectedNodes,
            chatDrawerOpenSource: null,
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
      setSampleDataInput: (stepName: string, payload: unknown) =>
        set((state) => {
          return {
            sampleDataInput: {
              ...state.sampleDataInput,
              [stepName]: payload,
            },
          };
        }),
      clearRun: (userHasPermissionToEditFlow: boolean) =>
        set({
          run: null,
          readonly: !userHasPermissionToEditFlow,
          loopsIndexes: {},
          leftSidebar: LeftSideBarType.NONE,
          selectedBranchIndex: null,
        }),
      exitStepSettings: () =>
        set((state) => ({
          rightSidebar: RightSideBarType.NONE,
          leftSidebar:
            state.leftSidebar === LeftSideBarType.AI_COPILOT
              ? LeftSideBarType.NONE
              : state.leftSidebar,
          selectedStep: null,
          selectedBranchIndex: null,
          askAiButtonProps: null,
        })),
      setRightSidebar: (rightSidebar: RightSideBarType) =>
        set({ rightSidebar }),
      setLeftSidebar: (leftSidebar: LeftSideBarType) =>
        set({ leftSidebar, askAiButtonProps: null }),
      setRun: async (run: FlowRun, flowVersion: FlowVersion) =>
        set((state) => {
          const lastStepWithStatus = flowRunUtils.findLastStepWithStatus(
            run.status,
            run.steps,
          );
          const initiallySelectedStep = run.steps
            ? determineInitiallySelectedStep(lastStepWithStatus, flowVersion)
            : state.selectedStep ?? 'trigger';
          return {
            loopsIndexes: flowRunUtils.findLoopsState(
              flowVersion,
              run,
              state.loopsIndexes,
            ),
            run,
            flowVersion,
            leftSidebar: LeftSideBarType.RUN_DETAILS,
            rightSidebar: initiallySelectedStep
              ? RightSideBarType.PIECE_SETTINGS
              : RightSideBarType.NONE,
            selectedStep: initiallySelectedStep,
            readonly: true,
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
      setLoopIndex: (stepName: string, index: number) => {
        set((state) => {
          const parentLoop = flowStructureUtil.getStepOrThrow(
            stepName,
            state.flowVersion.trigger,
          );
          if (parentLoop.type !== FlowActionType.LOOP_ON_ITEMS) {
            console.error(
              `Trying to set loop index for a step that is not a loop: ${stepName}`,
            );
            return state;
          }
          const childLoops = flowStructureUtil
            .getAllChildSteps(parentLoop)
            .filter((c) => c.type === FlowActionType.LOOP_ON_ITEMS)
            .filter((c) => c.name !== stepName);
          const loopsIndexes = { ...state.loopsIndexes };

          loopsIndexes[stepName] = index;

          childLoops.forEach((childLoop) => {

            const childLoopOutput = flowRunUtils.extractStepOutput(
              childLoop.name,
              loopsIndexes,
              state.run?.steps ?? {},
              state.flowVersion.trigger,
            ) as LoopStepOutput | undefined;

            if (isNil(childLoopOutput) || isNil(childLoopOutput.output)) {
              loopsIndexes[childLoop.name] = 0;
            } else {
              loopsIndexes[childLoop.name] = Math.max(
                Math.min(
                  loopsIndexes[childLoop.name],
                  childLoopOutput.output.iterations.length - 1,
                ),
                0,
              );
            }
          });
          return {
            loopsIndexes,
          };
        });
      },
      applyOperation: (
        operation: FlowOperationRequest,
        onSuccess?: () => void,
      ) =>
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
          flowUpdatesQueue.add(updateRequest);
          return { flowVersion: newFlowVersion };
        }),
      setVersion: (flowVersion: FlowVersion) => {
        const initiallySelectedStep = determineInitiallySelectedStep(
          null,
          flowVersion,
        );
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
          leftSidebar: LeftSideBarType.NONE,
          rightSidebar:
            initiallySelectedStep && !isEmptyTriggerInitiallySelected
              ? RightSideBarType.PIECE_SETTINGS
              : RightSideBarType.NONE,
          selectedBranchIndex: null,
        }));
      },
      insertMention: null,
      setInsertMentionHandler: (insertMention: InsertMentionHandler | null) => {
        set({ insertMention });
      },
      refreshSettings: () =>
        set((state) => ({
          refreshStepFormSettingsToggle: !state.refreshStepFormSettingsToggle,
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
      askAiButtonProps: null,
      setAskAiButtonProps: (props) => {
        return set((state) => {
          let leftSidebar = state.leftSidebar;
          if (props) {
            leftSidebar = LeftSideBarType.AI_COPILOT;
          } else if (state.leftSidebar === LeftSideBarType.AI_COPILOT) {
            leftSidebar = LeftSideBarType.NONE;
          }

          let rightSidebar = state.rightSidebar;
          if (props && props.type === FlowOperationType.UPDATE_ACTION) {
            rightSidebar = RightSideBarType.PIECE_SETTINGS;
          } else if (props) {
            rightSidebar = RightSideBarType.NONE;
          }

          let selectedStep = state.selectedStep;
          if (props && props.type === FlowOperationType.UPDATE_ACTION) {
            selectedStep = props.stepName;
          } else if (props) {
            selectedStep = null;
          }

          return {
            askAiButtonProps: props,
            leftSidebar,
            rightSidebar,
            selectedStep,
          };
        });
      },
      selectedNodes: [],
      setSelectedNodes: (nodes) => {
        return set(() => ({
          selectedNodes: nodes,
        }));
      },
      deselectStep: () => {
        return set(() => ({
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
          selectedStep: null,
        }));
      },
      panningMode: getPanningModeFromLocalStorage(),
      setPanningMode: (mode: 'grab' | 'pan') => {
        localStorage.setItem(DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE, mode);
        return set(() => ({
          panningMode: mode,
        }));
      },
      isFocusInsideListMapperModeInput: false,
      setIsFocusInsideListMapperModeInput: (
        isFocusInsideListMapperModeInput: boolean,
      ) => {
        return set(() => ({
          isFocusInsideListMapperModeInput,
        }));
      },
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
          stepName: getStepNameFromOperationType(operation, flowVersion),
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
            set(() => ({
              lastRerenderPieceSettingsTimeStamp: Date.now(),
            }));
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
            set(() => ({
              lastRerenderPieceSettingsTimeStamp: Date.now(),
            }));
            break;
          }
        }
        setOpenedPieceSelectorStepNameOrAddButtonId(null);
        return defaultValues.name;
      },
      selectedPieceMetadataInPieceSelector: null,
      setSelectedPieceMetadataInPieceSelector: (
        metadata: StepMetadataWithSuggestions | null,
      ) => {
        return set(() => ({
          selectedPieceMetadataInPieceSelector: metadata,
        }));
      },
      openedPieceSelectorStepNameOrAddButtonId: isEmptyTriggerInitiallySelected
        ? 'trigger'
        : null,
      setOpenedPieceSelectorStepNameOrAddButtonId: (
        stepNameOrAddButtonId: string | null,
      ) => {
        return set((state) => {
          const isReplacingEmptyTrigger =
            state.flowVersion.trigger.type === FlowTriggerType.EMPTY &&
            stepNameOrAddButtonId === 'trigger';
          return {
            openedPieceSelectorStepNameOrAddButtonId: stepNameOrAddButtonId,
            rightSidebar: isReplacingEmptyTrigger
              ? RightSideBarType.NONE
              : state.rightSidebar,
          };
        });
      },
      lastRerenderPieceSettingsTimeStamp: null,
      setLastRerenderPieceSettingsTimeStamp: (timestamp: number) => {
        return set(() => ({
          lastRerenderPieceSettingsTimeStamp: timestamp,
        }));
      },
    };
  });

export function getPanningModeFromLocalStorage(): 'grab' | 'pan' {
  return localStorage.getItem(DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE) ===
    'grab'
    ? 'grab'
    : 'pan';
}

const shortcutHandler = (
  event: KeyboardEvent,
  handlers: Record<keyof CanvasShortcutsProps, () => void>,
) => {
  const shortcutActivated = Object.entries(CanvasShortcuts).find(
    ([_, shortcut]) =>
      shortcut.shortcutKey?.toLowerCase() === event.key.toLowerCase() &&
      !!(
        shortcut.withCtrl === event.ctrlKey ||
        shortcut.withCtrl === event.metaKey
      ) &&
      !!shortcut.withShift === event.shiftKey,
  );
  if (shortcutActivated) {
    if (
      isNil(shortcutActivated[1].shouldNotPreventDefault) ||
      !shortcutActivated[1].shouldNotPreventDefault
    ) {
      event.preventDefault();
    }
    event.stopPropagation();
    handlers[shortcutActivated[0] as keyof CanvasShortcutsProps]();
  }
};

export const NODE_SELECTION_RECT_CLASS_NAME = 'react-flow__nodesselection-rect';
export const doesSelectionRectangleExist = () => {
  return document.querySelector(`.${NODE_SELECTION_RECT_CLASS_NAME}`) !== null;
};
export const useHandleKeyPressOnCanvas = () => {
  const [
    selectedNodes,
    flowVersion,
    selectedStep,
    exitStepSettings,
    applyOperation,
    readonly,
  ] = useBuilderStateContext((state) => [
    state.selectedNodes,
    state.flowVersion,
    state.selectedStep,
    state.exitStepSettings,
    state.applyOperation,
    state.readonly,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target === document.body ||
          e.target.classList.contains(NODE_SELECTION_RECT_CLASS_NAME) ||
          e.target.closest(`[data-${STEP_CONTEXT_MENU_ATTRIBUTE}]`)) &&
        !readonly
      ) {
        const selectedNodesWithoutTrigger = selectedNodes.filter(
          (node) => node !== flowVersion.trigger.name,
        );
        shortcutHandler(e, {
          Copy: () => {
            if (
              selectedNodesWithoutTrigger.length > 0 &&
              document.getSelection()?.toString() === ''
            ) {
              copySelectedNodes({
                selectedNodes: selectedNodesWithoutTrigger,
                flowVersion,
              });
            }
          },
          Delete: () => {
            if (selectedNodes.length > 0) {
              deleteSelectedNodes({
                exitStepSettings,
                selectedStep,
                selectedNodes,
                applyOperation,
              });
            }
          },
          Skip: () => {
            if (selectedNodesWithoutTrigger.length > 0) {
              toggleSkipSelectedNodes({
                selectedNodes: selectedNodesWithoutTrigger,
                flowVersion,
                applyOperation,
              });
            }
          },
          Paste: () => {
            getActionsInClipboard().then((actions) => {
              if (actions.length > 0) {
                const lastStep = [
                  flowVersion.trigger,
                  ...flowStructureUtil.getAllNextActionsWithoutChildren(
                    flowVersion.trigger,
                  ),
                ].at(-1)!.name;
                const lastSelectedNode =
                  selectedNodes.length === 1 ? selectedNodes[0] : null;
                pasteNodes(
                  flowVersion,
                  {
                    parentStepName: lastSelectedNode ?? lastStep,
                    stepLocationRelativeToParent:
                      StepLocationRelativeToParent.AFTER,
                  },
                  applyOperation,
                );
              }
            });
          },
        });
      }
    },
    [
      selectedNodes,
      flowVersion,
      applyOperation,
      selectedStep,
      exitStepSettings,
      readonly,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const useSwitchToDraft = () => {
  const [flowVersion, setVersion, clearRun, setFlow] = useBuilderStateContext(
    (state) => [
      state.flowVersion,
      state.setVersion,
      state.clearRun,
      state.setFlow,
    ],
  );
  const { checkAccess } = useAuthorization();
  const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);
  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    useMutation({
      mutationFn: async () => {
        const flow = await flowsApi.get(flowVersion.flowId);
        return flow;
      },
      onSuccess: (flow) => {
        setFlow(flow);
        setVersion(flow.version);
        clearRun(userHasPermissionToEditFlow);
      },
    });
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
};

export const useIsFocusInsideListMapperModeInput = ({
  containerRef,
  setIsFocusInsideListMapperModeInput,
  isFocusInsideListMapperModeInput,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  isFocusInsideListMapperModeInput: boolean;
}) => {
  useEffect(() => {
    const focusInListener = () => {
      const focusedElement = document.activeElement;
      const isFocusedInside = !!containerRef.current?.contains(focusedElement);
      const isFocusedInsideDataSelector =
        !isNil(document.activeElement) &&
        document.activeElement instanceof HTMLElement &&
        textMentionUtils.isDataSelectorOrChildOfDataSelector(
          document.activeElement,
        );
      setIsFocusInsideListMapperModeInput(
        isFocusedInside ||
          (isFocusedInsideDataSelector && isFocusInsideListMapperModeInput),
      );
    };
    document.addEventListener('focusin', focusInListener);
    return () => {
      document.removeEventListener('focusin', focusInListener);
    };
  }, [setIsFocusInsideListMapperModeInput, isFocusInsideListMapperModeInput]);
};
export const useFocusOnStep = () => {
  const [currentRun, selectStep] = useBuilderStateContext((state) => [
    state.run,
    state.selectStepByName,
  ]);

  const previousStatus = usePrevious(currentRun?.status);
  const currentStep = flowRunUtils.findLastStepWithStatus(
    previousStatus ?? FlowRunStatus.RUNNING,
    currentRun?.steps ?? {},
  );
  const lastStep = usePrevious(currentStep);

  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!isNil(lastStep) && lastStep !== currentStep && !isNil(currentStep)) {
      setTimeout(() => {
        console.log('focusing on step', currentStep);
        fitView(flowCanvasUtils.createFocusStepInGraphParams(currentStep));
        selectStep(currentStep);
      });
    }
  }, [lastStep, currentStep, selectStep, fitView]);
};

export const useResizeCanvas = (
  containerRef: React.RefObject<HTMLDivElement>,
  setHasCanvasBeenInitialised: (hasCanvasBeenInitialised: boolean) => void,
) => {
  const containerSizeRef = useRef({
    width: 0,
    height: 0,
  });
  const { getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setHasCanvasBeenInitialised(true);
      const { x, y, zoom } = getViewport();
      if (containerRef.current && width !== containerSizeRef.current.width) {
        const newX = x + (width - containerSizeRef.current.width) / 2;
        // Update the viewport to keep content centered without affecting zoom
        setViewport({ x: newX, y, zoom });
      }
      // Adjust x/y values based on the new size and keep the same zoom level
      containerSizeRef.current = {
        width,
        height,
      };
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [setViewport, getViewport]);
};

const getStepNameFromOperationType = (
  operation: PieceSelectorOperation,
  flowVersion: FlowVersion,
) => {
  switch (operation.type) {
    case FlowOperationType.UPDATE_ACTION:
      return operation.stepName;
    case FlowOperationType.ADD_ACTION:
      return flowStructureUtil.findUnusedName(flowVersion.trigger);
    case FlowOperationType.UPDATE_TRIGGER:
      return 'trigger';
  }
};
function determineInitiallySelectedStep(
  failedStepNameInRun: string | null,
  flowVersion: FlowVersion,
): string | null {
  if (failedStepNameInRun) {
    return failedStepNameInRun;
  }
  const firstInvalidStep = flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .find((s) => !s.valid);
  // eslint-disable-next-line no-restricted-globals
  const isNewFlow = location.search.includes(NEW_FLOW_QUERY_PARAM);
  if (isNewFlow) {
    return null;
  }
  return firstInvalidStep?.name ?? 'trigger';
}
