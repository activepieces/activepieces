import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  flowStructureUtil,
  FlowTrigger,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowLeftRight,
  ClipboardPaste,
  ClipboardPlus,
  Copy,
  CopyPlus,
  Route,
  RouteOff,
  Trash,
} from 'lucide-react';

import { Shortcut, ShortcutProps } from '@/components/custom/shortcut';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';

import { useBuilderStateContext } from '../../builder-hooks';
import { CanvasShortcuts } from '../../shortcuts';
import {
  copySelectedNodes,
  deleteSelectedNodes,
  getLastLocationAsPasteLocation,
  pasteNodes,
  toggleSkipSelectedNodes,
} from '../utils/bulk-actions';
import { ApButtonData } from '../utils/types';

import { CanvasContextMenuProps, ContextMenuType } from './canvas-context-menu';

const ShortcutWrapper = ({
  children,
  shortcut,
}: {
  children: React.ReactNode;
  shortcut: ShortcutProps;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 grow">
      <div className="flex gap-2 items-center">{children}</div>
      <Shortcut {...shortcut} className="text-end" />
    </div>
  );
};

function getBigAddButtonPasteLabel(
  bigAddButtonData: ApButtonData | null | undefined,
  trigger: FlowTrigger,
) {
  if (!bigAddButtonData) {
    return '';
  }
  if (
    bigAddButtonData.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_LOOP
  ) {
    return t('Paste Inside Loop');
  }
  if (
    bigAddButtonData.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
  ) {
    const parentRouter = flowStructureUtil.getStep(
      bigAddButtonData.parentStepName,
      trigger,
    );
    const branchName =
      parentRouter?.type === FlowActionType.ROUTER
        ? parentRouter.settings.branches[bigAddButtonData.branchIndex]
            ?.branchName ?? ''
        : '';
    return t('Paste Inside {branchName}', { branchName });
  }
  // Big add buttons are never created with AFTER (only INSIDE_LOOP and INSIDE_BRANCH)
  return t('Paste After');
}

export const CanvasContextMenuContent = ({
  contextMenuType,
  bigAddButtonData,
}: CanvasContextMenuProps) => {
  const [
    selectedNodes,
    applyOperation,
    selectedStep,
    flowVersion,
    exitStepSettings,
    readonly,
    setOpenedPieceSelectorStepNameOrAddButtonId,
  ] = useBuilderStateContext((state) => [
    state.selectedNodes,
    state.applyOperation,
    state.selectedStep,
    state.flowVersion,
    state.exitStepSettings,
    state.readonly,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
  ]);
  const disabled = selectedNodes.length === 0;
  const areAllStepsSkipped = selectedNodes.every(
    (node) =>
      !!(flowStructureUtil.getStep(node, flowVersion.trigger) as FlowAction)
        ?.skip,
  );
  const doSelectedNodesIncludeTrigger = selectedNodes.some(
    (node) => node === flowVersion.trigger.name,
  );

  const firstSelectedStep = flowStructureUtil.getStep(
    selectedNodes[0],
    flowVersion.trigger,
  );
  const showPasteAfterLastStep =
    !readonly &&
    contextMenuType === ContextMenuType.CANVAS &&
    isNil(bigAddButtonData);
  const showPasteAsBigAddButtonAction =
    !readonly &&
    contextMenuType === ContextMenuType.CANVAS &&
    !isNil(bigAddButtonData);
  const showPasteAsFirstLoopAction =
    selectedNodes.length === 1 &&
    firstSelectedStep?.type === FlowActionType.LOOP_ON_ITEMS &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
  const showPasteAsBranchChild =
    selectedNodes.length === 1 &&
    firstSelectedStep?.type === FlowActionType.ROUTER &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
  const showPasteAfterCurrentStep =
    selectedNodes.length === 1 &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
  const showReplace =
    selectedNodes.length === 1 &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;

  const showCopy =
    !doSelectedNodesIncludeTrigger && contextMenuType === ContextMenuType.STEP;
  const showDuplicate =
    selectedNodes.length === 1 &&
    !doSelectedNodesIncludeTrigger &&
    contextMenuType === ContextMenuType.STEP &&
    !readonly;
  const showSkip =
    !doSelectedNodesIncludeTrigger &&
    contextMenuType === ContextMenuType.STEP &&
    !readonly;
  const isTriggerTheOnlySelectedNode =
    selectedNodes.length === 1 && doSelectedNodesIncludeTrigger;
  const showDelete =
    !readonly &&
    contextMenuType === ContextMenuType.STEP &&
    !isTriggerTheOnlySelectedNode;
  const duplicateStep = () => {
    applyOperation({
      type: FlowOperationType.DUPLICATE_ACTION,
      request: {
        stepName: selectedNodes[0],
      },
    });
  };
  const showContextMenuContent =
    showReplace ||
    showCopy ||
    showDuplicate ||
    showSkip ||
    showPasteAsFirstLoopAction ||
    showPasteAsBranchChild ||
    showPasteAfterCurrentStep ||
    showPasteAfterLastStep ||
    showPasteAsBigAddButtonAction ||
    showDelete;
  if (!showContextMenuContent) {
    return null;
  }

  return (
    <ContextMenuContent>
      {showReplace && (
        <ContextMenuItem
          disabled={disabled}
          onClick={() => {
            setOpenedPieceSelectorStepNameOrAddButtonId(selectedNodes[0]);
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4"></ArrowLeftRight> {t('Replace')}
        </ContextMenuItem>
      )}
      {showCopy && (
        <ContextMenuItem
          disabled={disabled}
          onClick={() => {
            copySelectedNodes({ selectedNodes, flowVersion });
          }}
        >
          <ShortcutWrapper shortcut={CanvasShortcuts['Copy']}>
            <Copy className="w-4 h-4"></Copy> {t('Copy')}
          </ShortcutWrapper>
        </ContextMenuItem>
      )}

      <>
        {showDuplicate && (
          <ContextMenuItem
            disabled={disabled}
            onClick={duplicateStep}
            className="flex items-center gap-2"
          >
            <CopyPlus className="w-4 h-4"></CopyPlus> {t('Duplicate')}
          </ContextMenuItem>
        )}

        {showSkip && (
          <ContextMenuItem
            disabled={disabled}
            onClick={() => {
              toggleSkipSelectedNodes({
                selectedNodes,
                flowVersion,
                applyOperation,
              });
            }}
          >
            <ShortcutWrapper shortcut={CanvasShortcuts['Skip']}>
              {areAllStepsSkipped ? (
                <Route className="h-4 w-4"></Route>
              ) : (
                <RouteOff className="h-4 w-4"></RouteOff>
              )}
              {areAllStepsSkipped ? t('Unskip') : t('Skip')}
            </ShortcutWrapper>
          </ContextMenuItem>
        )}
        {(showPasteAsFirstLoopAction ||
          showPasteAsBranchChild ||
          showPasteAfterCurrentStep) && (
          <ContextMenuSeparator></ContextMenuSeparator>
        )}

        {showPasteAfterLastStep && (
          <ContextMenuItem
            onClick={() => {
              const pasteLocation = getLastLocationAsPasteLocation(flowVersion);
              if (pasteLocation) {
                pasteNodes(flowVersion, pasteLocation, applyOperation);
              }
            }}
            className="flex items-center gap-2"
          >
            <ClipboardPlus className="w-4 h-4"></ClipboardPlus>{' '}
            {t('Paste After Last Step')}
          </ContextMenuItem>
        )}

        {showPasteAsBigAddButtonAction && (
          <ContextMenuItem
            onClick={() => {
              if (bigAddButtonData) {
                pasteNodes(flowVersion, bigAddButtonData, applyOperation);
              }
            }}
            className="flex items-center gap-2"
          >
            <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
            {getBigAddButtonPasteLabel(bigAddButtonData, flowVersion.trigger)}
          </ContextMenuItem>
        )}

        {showPasteAsFirstLoopAction && (
          <ContextMenuItem
            onClick={() => {
              pasteNodes(
                flowVersion,
                {
                  parentStepName: selectedNodes[0],
                  stepLocationRelativeToParent:
                    StepLocationRelativeToParent.INSIDE_LOOP,
                },
                applyOperation,
              );
            }}
            className="flex items-center gap-2"
          >
            <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
            {t('Paste Inside Loop')}
          </ContextMenuItem>
        )}

        {showPasteAfterCurrentStep && (
          <ContextMenuItem
            onClick={() => {
              pasteNodes(
                flowVersion,
                {
                  parentStepName: selectedNodes[0],
                  stepLocationRelativeToParent:
                    StepLocationRelativeToParent.AFTER,
                },
                applyOperation,
              );
            }}
            className="flex items-center gap-2"
          >
            <ClipboardPlus className="w-4 h-4"></ClipboardPlus>{' '}
            {t('Paste After')}
          </ContextMenuItem>
        )}

        {showPasteAsBranchChild && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
              {t('Paste Inside...')}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {firstSelectedStep &&
                firstSelectedStep.settings.branches.map(
                  (branch, branchIndex) => (
                    <ContextMenuItem
                      key={branch.branchName}
                      onClick={() => {
                        pasteNodes(
                          flowVersion,
                          {
                            parentStepName: selectedNodes[0],
                            stepLocationRelativeToParent:
                              StepLocationRelativeToParent.INSIDE_BRANCH,
                            branchIndex,
                          },
                          applyOperation,
                        );
                      }}
                    >
                      {branch.branchName}
                    </ContextMenuItem>
                  ),
                )}
              <ContextMenuItem
                onClick={() => {
                  applyOperation({
                    type: FlowOperationType.ADD_BRANCH,
                    request: {
                      stepName: firstSelectedStep.name,
                      branchIndex:
                        firstSelectedStep.settings.branches.length - 1,
                      branchName: `Branch ${firstSelectedStep.settings.branches.length}`,
                    },
                  });
                  pasteNodes(
                    flowVersion,
                    {
                      parentStepName: firstSelectedStep.name,
                      stepLocationRelativeToParent:
                        StepLocationRelativeToParent.INSIDE_BRANCH,
                      branchIndex:
                        firstSelectedStep.settings.branches.length - 1,
                    },
                    applyOperation,
                  );
                }}
              >
                + {t('New Branch')}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {showDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              disabled={disabled}
              onClick={() => {
                deleteSelectedNodes({
                  selectedNodes,
                  applyOperation,
                  selectedStep,
                  exitStepSettings,
                });
              }}
            >
              <ShortcutWrapper shortcut={CanvasShortcuts['Delete']}>
                <Trash className="w-4 stroke-destructive h-4"></Trash>{' '}
                <div className="text-destructive">{t('Delete')}</div>
              </ShortcutWrapper>
            </ContextMenuItem>
          </>
        )}
      </>
    </ContextMenuContent>
  );
};
