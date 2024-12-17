import { t } from 'i18next';
import { ArrowLeftRight, ClipboardPaste, Copy, CopyPlus, Route, RouteOff, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContextMenuItem,ContextMenuSeparator } from '@/components/ui/context-menu';
import { Shortcut, ShortcutProps } from '@/components/ui/shortcut';
import {
  Action,
  FlowOperationType,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import {
  copySelectedNodes,
  deleteSelectedNodes,
  getActionsInClipboard,
  getLastLocationAsPasteLocation,
  pasteNodes,
  toggleSkipSelectedNodes,
} from '../bulk-actions';

import { CanvasContextMenuProps, CanvasShortcuts } from './canvas-context-menu';
import { toast, UNSAVED_CHANGES_TOAST } from '@/components/ui/use-toast';

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
  pasteActionData,
  setPieceSelectorStep,
}: CanvasContextMenuProps) => {
  const disabled = selectedNodes.length === 0;
  const areAllStepsSkipped = selectedNodes.every(
    (node) =>
      !!(flowStructureUtil.getStep(node, flowVersion.trigger) as Action)?.skip,
  );
  const [actions, setActions] = useState<Action[]>([]);
  const { addButtonData, singleSelectedStepName } = pasteActionData;

  useEffect(() => {
    const fetchClipboardOperations = async () => {
      const fetchedOperations = await getActionsInClipboard();
      if (fetchedOperations.length > 0) {
        setActions(fetchedOperations);
      } else {
        setActions([]);
      }
    };
    fetchClipboardOperations();
  }, []);
 const doesNotContainTrigger = !selectedNodes.some((node) => node === flowVersion.trigger.name)
 console.log(selectedNodes)
  const showPasteAfterLastStep =
    !readonly &&
    isNil(addButtonData) &&
    !singleSelectedStepName &&
    selectedNodes.length === 0;
  const showPasteAfterSingleSelectedStep =
    !readonly && isNil(addButtonData) && singleSelectedStepName;
  const showPasteOnAddButton = !readonly && !isNil(addButtonData);
  const disabledPaste = actions.length === 0;
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
  return (
    <>
      {isNil(addButtonData) && (
        <>
        { doesNotContainTrigger &&
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
        }
          
          {
           selectedNodes.length === 1 && !readonly && (
            <ContextMenuItem
            disabled={disabled}
            onClick={() => {
              setPieceSelectorStep(selectedNodes[0]);
            }}
            className='flex items-center gap-2'
          >
              <ArrowLeftRight className="w-4 h-4"></ArrowLeftRight> {t('Replace')}
          </ContextMenuItem>
           )
          }
          {selectedNodes.length === 1 && !readonly  && doesNotContainTrigger && (
            <ContextMenuItem
              disabled={disabled}
              onClick={duplicateStep}
              className="flex items-center gap-2"
            >
              <CopyPlus className="w-4 h-4"></CopyPlus> {t('Duplicate')}
            </ContextMenuItem>
          )}

          {!readonly && (
            <>
              { doesNotContainTrigger  && <ContextMenuItem
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
              </ContextMenuItem>}
              {showPasteAfterLastStep && (
                <ContextMenuItem
                  disabled={disabledPaste}
                  onClick={() => {
                    const pasteLocation =
                      getLastLocationAsPasteLocation(flowVersion);
                    if (pasteLocation) {
                      pasteNodes(
                        actions,
                        flowVersion,
                        pasteLocation,
                        applyOperation,
                      );
                    }
                  }}
                >
                  <ShortcutWrapper shortcut={CanvasShortcuts['Paste']}>
                    <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
                    {t('Paste After Last Step')}
                  </ShortcutWrapper>
                </ContextMenuItem>
              )}

              {showPasteAfterSingleSelectedStep && (
                <ContextMenuItem
                  disabled={disabledPaste}
                  onClick={() => {
                    pasteNodes(
                      actions,
                      flowVersion,
                      {
                        parentStepName: singleSelectedStepName,
                        stepLocationRelativeToParent:
                          StepLocationRelativeToParent.AFTER,
                      },
                      applyOperation,
                    );
                  }}
                  className="flex items-center gap-2"
                >
                  <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
                  {t('Paste After')}
                </ContextMenuItem>
              )}
             {doesNotContainTrigger && (
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
      )}

      {showPasteOnAddButton && (
        <ContextMenuItem
          disabled={disabledPaste}
          onClick={() => {
            pasteNodes(actions, flowVersion, addButtonData, applyOperation);
          }}
          className="flex items-center gap-2"
        >
          <ClipboardPaste className="w-4 h-4"></ClipboardPaste> {t('Paste')}
        </ContextMenuItem>
      )}
    </>
  );
};
