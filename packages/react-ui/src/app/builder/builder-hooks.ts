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

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PromiseQueue } from '@/lib/promise-queue';
import {
  FlowOperationRequest,
  FlowOperationType,
  FlowRun,
  FlowVersion,
  FlowVersionState,
  Permission,
  PopulatedFlow,
  TriggerType,
  flowOperations,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
  isFlowStateTerminal,
} from '@activepieces/shared';

import { flowRunUtils } from '../../features/flow-runs/lib/flow-run-utils';
import { AskAiButtonOperations } from '../../features/pieces/lib/types';
import { useAuthorization } from '../../hooks/authorization-hooks';

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
  refreshSettings: () => void;
  setSelectedBranchIndex: (index: number | null) => void;
  exitRun: (userHasPermissionToEditFlow: boolean) => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  applyOperation: (operation: FlowOperationRequest) => void;
  removeStepSelection: () => void;
  selectStepByName: (stepName: string) => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  setFlow: (flow: PopulatedFlow) => void;
  setSampleData: (stepName: string, payload: unknown) => void;
  setSampleDataInput: (stepName: string, payload: unknown) => void;
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
  askAiButtonProps: AskAiButtonOperations | null;
  setAskAiButtonProps: (props: AskAiButtonOperations | null) => void;
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
  panningMode: 'grab' | 'pan';
  setPanningMode: (mode: 'grab' | 'pan') => void;
  pieceSelectorStep: string | null;
  setPieceSelectorStep: (step: string | null) => void;
  isFocusInsideListMapperModeInput: boolean;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  isPublishing: boolean;
  setIsPublishing: (isPublishing: boolean) => void;
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

export const createBuilderStore = (
  initialState: BuilderInitialState,
  newFlow: boolean,
) =>
  create<BuilderState>((set) => {
    const failedStepInRun = initialState.run?.steps
      ? flowRunUtils.findFailedStepInOutput(initialState.run.steps)
      : null;
    const initiallySelectedStep = newFlow
      ? null
      : determineInitiallySelectedStep(
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
        initiallySelectedStep &&
        (initiallySelectedStep !== 'trigger' ||
          initialState.flowVersion.trigger.type !== TriggerType.EMPTY)
          ? RightSideBarType.PIECE_SETTINGS
          : RightSideBarType.NONE,
      refreshStepFormSettingsToggle: false,

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
            state.flowVersion.trigger.type === TriggerType.EMPTY
              ? RightSideBarType.NONE
              : RightSideBarType.PIECE_SETTINGS;

          const leftSidebar = !isNil(state.run)
            ? LeftSideBarType.RUN_DETAILS
            : LeftSideBarType.NONE;

          return {
            selectedStep,
            rightSidebar,
            leftSidebar,
            selectedBranchIndex: null,
            askAiButtonProps: null,
            selectedNodes,
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
      exitPieceSelector: () =>
        set({
          rightSidebar: RightSideBarType.NONE,
          selectedBranchIndex: null,
        }),
      setRightSidebar: (rightSidebar: RightSideBarType) =>
        set({ rightSidebar }),
      setLeftSidebar: (leftSidebar: LeftSideBarType) =>
        set({ leftSidebar, askAiButtonProps: null }),
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
          return {
            loopsIndexes: {
              ...state.loopsIndexes,
              [stepName]: index,
            },
          };
        });
      },
      applyOperation: (operation: FlowOperationRequest) =>
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
            } catch (error) {
              console.error(error);
              flowUpdatesQueue.halt();
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
      panningMode: getPanningModeFromLocalStorage(),
      setPanningMode: (mode: 'grab' | 'pan') => {
        localStorage.setItem(DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE, mode);
        return set(() => ({
          panningMode: mode,
        }));
      },
      pieceSelectorStep: null,
      setPieceSelectorStep: (step: string | null) => {
        return set((state) => {
          return {
            pieceSelectorStep: step,
            selectedStep: step ? step : state.selectedStep,
            rightSidebar:
              (step && step !== 'trigger') ||
              state.flowVersion.trigger.type !== TriggerType.EMPTY
                ? RightSideBarType.PIECE_SETTINGS
                : state.rightSidebar,
          };
        });
      },
      isFocusInsideListMapperModeInput: false,
      setIsFocusInsideListMapperModeInput: (
        isFocusInsideListMapperModeInput: boolean,
      ) => {
        return set(() => ({
          isFocusInsideListMapperModeInput,
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
          e.target.classList.contains('react-flow__nodesselection-rect') ||
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
  const [flowVersion, setVersion, exitRun, setFlow] = useBuilderStateContext(
    (state) => [
      state.flowVersion,
      state.setVersion,
      state.exitRun,
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
export const useFocusedFailedStep = () => {
  const currentRun = useBuilderStateContext((state) => state.run);
  const previousRun = usePrevious(currentRun);
  const { fitView } = useReactFlow();
  if (
    (currentRun &&
      previousRun?.id !== currentRun.id &&
      isFlowStateTerminal(currentRun.status)) ||
    (currentRun &&
      previousRun &&
      !isFlowStateTerminal(previousRun.status) &&
      isFlowStateTerminal(currentRun.status))
  ) {
    const failedStep = currentRun.steps
      ? flowRunUtils.findFailedStepInOutput(currentRun.steps)
      : null;
    if (failedStep) {
      setTimeout(() => {
        fitView(flowCanvasUtils.createFocusStepInGraphParams(failedStep));
      });
    }
  }
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
