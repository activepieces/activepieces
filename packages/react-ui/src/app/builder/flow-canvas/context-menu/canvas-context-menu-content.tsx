import { t } from 'i18next';
import { ClipboardPaste, Copy, Route, RouteOff, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContextMenuItem } from '@/components/ui/context-menu';
import {
  Action,
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

import { CanvasContextMenuProps } from './canvas-context-menu';

export const CanvasContextMenuContent = ({
  selectedNodes,
  applyOperation,
  selectedStep,
  flowVersion,
  exitStepSettings,
  readonly,
  pasteActionData,
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


  const showPasteAfterLastStep =
    !readonly &&
    isNil(addButtonData) &&
    !singleSelectedStepName &&
    selectedNodes.length === 0;
  const showPasteAfterSingleSelectedStep =
    !readonly && isNil(addButtonData) && singleSelectedStepName;
  const showPasteOnAddButton = !readonly && !isNil(addButtonData);
  const disabledPaste = actions.length === 0;
  return (
    <>
      <ContextMenuItem
        disabled={disabled}
        onClick={() => {
          copySelectedNodes({ selectedNodes, flowVersion });
        }}
      >
        <div className="flex gap-2 items-center">
          <Copy className="w-4 h-4"></Copy> {t('Copy')}
        </div>
      </ContextMenuItem>

      {!readonly && (
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
          <div className="flex gap-2 items-center ">
            {areAllStepsSkipped ? (
              <Route className="h-4 w-4"></Route>
            ) : (
              <RouteOff className="h-4 w-4"></RouteOff>
            )}
            {t(areAllStepsSkipped ? 'Unskip' : 'Skip')}
          </div>
        </ContextMenuItem>
      )}

      {!readonly && (
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
          <div className="flex gap-2 items-center text-destructive">
            <Trash className="w-4 stroke-destructive h-4"></Trash> {t('Delete')}
          </div>
        </ContextMenuItem>
      )}

      {!readonly && (
        <>
          {showPasteAfterLastStep && (
            <ContextMenuItem
              disabled={disabledPaste}
              onClick={() => {
                const pasteLocation = getLastLocationAsPasteLocation(flowVersion)
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
              <div className="flex gap-2 items-center">
                <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
                {t('Paste After Last Step')}
              </div>
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
            >
              <div className="flex gap-2 items-center">
                <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
                {t('Paste After')}
              </div>
            </ContextMenuItem>
          )}

          {showPasteOnAddButton && (
            <ContextMenuItem
              disabled={disabledPaste}
              onClick={() => {
                  pasteNodes(
                  actions,
                    flowVersion,
                  addButtonData,
                    applyOperation,
                  );
              }}
            >
              <div className="flex gap-2 items-center">
                <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
                {t('Paste')}
              </div>
            </ContextMenuItem>
          )}
        </>
      )}
    </>
  );
};
