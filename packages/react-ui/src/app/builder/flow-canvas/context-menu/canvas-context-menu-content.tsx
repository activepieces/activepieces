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

import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { Shortcut, ShortcutProps } from '@/components/ui/shortcut';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';
import {
  Action,
  ActionType,
  FlowOperationType,
  flowStructureUtil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import { usePasteActionsInClipboard } from '../../builder-hooks';
import {
  copySelectedNodes,
  deleteSelectedNodes,
  getLastLocationAsPasteLocation,
  pasteNodes,
  toggleSkipSelectedNodes,
} from '../bulk-actions';

import { CanvasContextMenuProps, CanvasShortcuts } from './canvas-context-menu';

const ShortcutWrapper = ({
  children,
  shortcut,
}: {
  children: React.ReactNode;
  shortcut: ShortcutProps;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 flex-grow">
      <div className="flex gap-2 items-center">{children}</div>
      <Shortcut {...shortcut} className="text-end" />
    </div>
  );
};

export const CanvasContextMenuContent = ({
  selectedNodes,
  applyOperation,
  selectedStep,
  flowVersion,
  exitStepSettings,
  readonly,
  setPieceSelectorStep,
}: CanvasContextMenuProps) => {
  const disabled = selectedNodes.length === 0;
  const areAllStepsSkipped = selectedNodes.every(
    (node) =>
      !!(flowStructureUtil.getStep(node, flowVersion.trigger) as Action)?.skip,
  );
  const actionsToPaste = usePasteActionsInClipboard();
  const doesNotContainTrigger = !selectedNodes.some(
    (node) => node === flowVersion.trigger.name,
  );
  const showPasteAfterLastStep = !readonly && selectedNodes.length === 0;
  const disabledPaste = actionsToPaste.length === 0;
  const firstSelectedStep = flowStructureUtil.getStep(
    selectedNodes[0],
    flowVersion.trigger,
  );
  const showPasteAsFirstLoopAction =
    selectedNodes.length === 1 &&
    firstSelectedStep?.type === ActionType.LOOP_ON_ITEMS;
  const showPasteAsBranchChild =
    selectedNodes.length === 1 && firstSelectedStep?.type === ActionType.ROUTER;

  const duplicateStep = () => {
    applyOperation(
      {
        type: FlowOperationType.DUPLICATE_ACTION,
        request: {
          stepName: selectedNodes[0],
        },
      },
      () => toast(UNSAVED_CHANGES_TOAST),
    );
  };
  const showPasteAfterCurrentStep = selectedNodes.length === 1;
  return (
    <>
      {selectedNodes.length === 1 && !readonly && (
        <ContextMenuItem
          disabled={disabled}
          onClick={() => {
            setPieceSelectorStep(selectedNodes[0]);
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4"></ArrowLeftRight> {t('Replace')}
        </ContextMenuItem>
      )}
      {doesNotContainTrigger && (
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

      {!readonly && (
        <>
          {selectedNodes.length === 1 && doesNotContainTrigger && (
            <ContextMenuItem
              disabled={disabled}
              onClick={duplicateStep}
              className="flex items-center gap-2"
            >
              <CopyPlus className="w-4 h-4"></CopyPlus> {t('Duplicate')}
            </ContextMenuItem>
          )}

          {doesNotContainTrigger && (
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
                {t(areAllStepsSkipped ? 'Unskip' : 'Skip')}
              </ShortcutWrapper>
            </ContextMenuItem>
          )}
          {(showPasteAfterLastStep ||
            showPasteAsFirstLoopAction ||
            showPasteAsBranchChild ||
            showPasteAfterCurrentStep) && (
            <ContextMenuSeparator></ContextMenuSeparator>
          )}

          {showPasteAfterLastStep && (
            <ContextMenuItem
              disabled={disabledPaste}
              onClick={() => {
                const pasteLocation =
                  getLastLocationAsPasteLocation(flowVersion);
                if (pasteLocation) {
                  pasteNodes(
                    actionsToPaste,
                    flowVersion,
                    pasteLocation,
                    applyOperation,
                  );
                }
              }}
            >
              <ShortcutWrapper shortcut={CanvasShortcuts['Paste']}>
                <ClipboardPlus className="w-4 h-4"></ClipboardPlus>{' '}
                {t('Paste After Last Step')}
              </ShortcutWrapper>
            </ContextMenuItem>
          )}

          {showPasteAsFirstLoopAction && (
            <ContextMenuItem
              disabled={disabledPaste}
              onClick={() => {
                pasteNodes(
                  actionsToPaste,
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
              disabled={disabledPaste}
              onClick={() => {
                pasteNodes(
                  actionsToPaste,
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

          {showPasteAsBranchChild && !disabledPaste && (
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
                            actionsToPaste,
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
                    applyOperation(
                      {
                        type: FlowOperationType.ADD_BRANCH,
                        request: {
                          stepName: firstSelectedStep.name,
                          branchIndex:
                            firstSelectedStep.settings.branches.length - 1,
                          branchName: `Branch ${firstSelectedStep.settings.branches.length}`,
                        },
                      },
                      () => {},
                    );
                    pasteNodes(
                      actionsToPaste,
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

          {showPasteAsBranchChild && disabledPaste && (
            <ContextMenuItem
              disabled={true}
              className="flex items-center gap-2"
            >
              <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
              {t('Paste Inside Branch')}
            </ContextMenuItem>
          )}
          {doesNotContainTrigger && !readonly && (
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
      )}
    </>
  );
};
