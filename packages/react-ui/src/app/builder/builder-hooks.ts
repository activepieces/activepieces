import { useMutation } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { usePrevious } from 'react-use';
import { create, useStore } from 'zustand';

import { useEmbedding } from '@/components/embed-provider';
import { Messages } from '@/features/chat/chat-message-list';
import { flowsApi } from '@/features/flows/lib/flows-api';
import {
  FlowOperationType,
  FlowRun,
  FlowVersion,
  Permission,
  PopulatedFlow,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
  FlowRunStatus,
  apId,
  FlowTriggerType,
  FlowActionType,
  LoopStepOutput,
} from '@activepieces/shared';

import { flowRunUtils } from '../../features/flow-runs/lib/flow-run-utils';
import { useAuthorization } from '../../hooks/authorization-hooks';
import {
  ChatDrawerSource,
  PieceSelectorOperation,
  RightSideBarType,
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
import { createFlowState, FlowState } from './state/flow-state';

export const BuilderStateContext = createContext<BuilderStore | null>(null);

export function useBuilderStateContext<T>(
  selector: (state: BuilderState) => T,
): T {
  const store = useContext(BuilderStateContext);
  if (!store)
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  return useStore(store, selector);
}



type InsertMentionHandler = (propertyPath: string) => void;
export type BuilderState = FlowState & {
  readonly: boolean;
  hideTestWidget: boolean;
  outputSampleData: Record<string, unknown>;
  inputSampleData: Record<string, unknown>;
  loopsIndexes: Record<string, number>;
  run: FlowRun | null;
  rightSidebar: RightSideBarType;
  selectedStep: string | null;
  activeDraggingStep: string | null;
  selectedBranchIndex: number | null;
  chatDrawerOpenSource: ChatDrawerSource | null;
  chatSessionMessages: Messages;
  chatSessionId: string | null;
  showMinimap: boolean;
  setShowMinimap: (showMinimap: boolean) => void;
  setChatDrawerOpenSource: (source: ChatDrawerSource | null) => void;
  setChatSessionMessages: (messages: Messages) => void;
  addChatMessage: (message: Messages[0]) => void;
  clearChatSession: () => void;
  setChatSessionId: (sessionId: string | null) => void;
  setSelectedBranchIndex: (index: number | null) => void;
  clearRun: (userHasPermissionToEditFlow: boolean) => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  removeStepSelection: () => void;
  selectStepByName: (stepName: string) => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  insertMention: InsertMentionHandler | null;
  setReadOnly: (readOnly: boolean) => void;
  setInsertMentionHandler: (handler: InsertMentionHandler | null) => void;
  setLoopIndex: (stepName: string, index: number) => void;
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
  panningMode: 'grab' | 'pan';
  setPanningMode: (mode: 'grab' | 'pan') => void;
  isFocusInsideListMapperModeInput: boolean;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
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
};
const DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE = 'defaultPanningMode';
export type BuilderInitialState = Pick<
  BuilderState,
  | 'flow'
  | 'flowVersion'
  | 'readonly'
  | 'hideTestWidget'
  | 'run'
  | 'outputSampleData'
  | 'inputSampleData'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;
export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set, get) => {
    const flowState = createFlowState(initialState, get, set);

    const failedStepNameInRun = initialState.run?.steps
      ? flowRunUtils.findLastStepWithStatus(
          initialState.run.status,
          initialState.run.steps,
        )
      : null;
    const initiallySelectedStep = flowCanvasUtils.determineInitiallySelectedStep(
      failedStepNameInRun,
      initialState.flowVersion,
    );
    const isEmptyTriggerInitiallySelected =
      initiallySelectedStep === 'trigger' &&
      initialState.flowVersion.trigger.type === FlowTriggerType.EMPTY;
    return {
      ...flowState,
      showMinimap: false,
      setShowMinimap: (showMinimap: boolean) => set({ showMinimap }),
      loopsIndexes:
        initialState.run && initialState.run.steps
          ? flowRunUtils.findLoopsState(
              initialState.flowVersion,
              initialState.run,
              {},
            )
          : {},
      outputSampleData: initialState.outputSampleData,
      inputSampleData: initialState.inputSampleData,
      flow: initialState.flow,
      flowVersion: initialState.flowVersion,
      readonly: initialState.readonly,
      hideTestWidget: initialState.hideTestWidget ?? false,
      run: initialState.run,
      saving: false,
      selectedStep: initiallySelectedStep,
      activeDraggingStep: null,
      rightSidebar:
        initiallySelectedStep && !isEmptyTriggerInitiallySelected
          ? RightSideBarType.PIECE_SETTINGS
          : RightSideBarType.NONE,
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
          const selectedNodes = isNil(selectedStep) ? [] : [selectedStep];

          const rightSidebar =
            selectedStep === 'trigger' &&
            state.flowVersion.trigger.type === FlowTriggerType.EMPTY
              ? RightSideBarType.NONE
              : RightSideBarType.PIECE_SETTINGS;

          const isEmptyTrigger =
            selectedStep === 'trigger' &&
            state.flowVersion.trigger.type === FlowTriggerType.EMPTY;

          return {
            openedPieceSelectorStepNameOrAddButtonId: isEmptyTrigger
              ? 'trigger'
              : null,
            selectedStep,
            rightSidebar,
            selectedBranchIndex: null,
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

      clearRun: (userHasPermissionToEditFlow: boolean) =>
        set({
          run: null,
          readonly: !userHasPermissionToEditFlow,
          loopsIndexes: {},
          selectedBranchIndex: null,
        }),
      exitStepSettings: () =>
        set((state) => ({
          rightSidebar: RightSideBarType.NONE,
          selectedStep: null,
          selectedBranchIndex: null,
        })),
      setRightSidebar: (rightSidebar: RightSideBarType) =>
        set({ rightSidebar }),
      setRun: async (run: FlowRun, flowVersion: FlowVersion) =>
        set((state) => {
          const lastStepWithStatus = flowRunUtils.findLastStepWithStatus(
            run.status,
            run.steps,
          );
          const initiallySelectedStep = run.steps
            ? flowCanvasUtils.determineInitiallySelectedStep(lastStepWithStatus, flowVersion)
            : state.selectedStep ?? 'trigger';
          return {
            loopsIndexes: flowRunUtils.findLoopsState(
              flowVersion,
              run,
              state.loopsIndexes,
            ),
            run,
            flowVersion,
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
      insertMention: null,
      setInsertMentionHandler: (insertMention: InsertMentionHandler | null) => {
        set({ insertMention });
      },
      selectedBranchIndex: null,
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


export const useShowBuilderIsSavingWarningBeforeLeaving = () => {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  const isSaving = useBuilderStateContext((state) => state.saving);
  useEffect(() => {
    if (isEmbedded) {
      return;
    }
    const message = t(
      'Leaving this page while saving will discard your changes, are you sure you want to leave?',
    );
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (isSaving) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaving, isEmbedded]);
};
