import { Value } from '@sinclair/typebox/value';
import { t } from 'i18next';
import { ClipboardPaste, Copy, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ContextMenuItem } from '@/components/ui/context-menu';
import {
  AddActionRequest,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import { copySelectedNodes } from '../bulk-actions/copy-selected-nodes';
import { deleteSelectedNodes } from '../bulk-actions/delete-selected-nodes';
import {
  getOperationsInClipboard,
  pasteNodes,
} from '../bulk-actions/paste-nodes';

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
  const [operations, setOperations] = useState<AddActionRequest[]>([]);
  const { addButtonData, singleSelectedStepName } = pasteActionData;
  useEffect(() => {
    const fetchClipboardOperations = async () => {
      const fetchedOperations = await getOperationsInClipboard();
      if (
        fetchedOperations.length > 0 &&
        fetchedOperations.every((operation) =>
          Value.Check(AddActionRequest, operation),
        )
      ) {
        setOperations(fetchedOperations);
      } else {
        setOperations([]);
      }
    };
    fetchClipboardOperations();
  }, []);
  const showCopyAndDelete = !readonly && isNil(addButtonData);
  const showPasteAfterLastStep =
    !readonly &&
    isNil(addButtonData) &&
    !singleSelectedStepName &&
    selectedNodes.length === 0;
  const showPasteAfterSingleSelectedStep =
    !readonly && isNil(addButtonData) && singleSelectedStepName;
  const showPasteOnAddButton = !readonly && !isNil(addButtonData);
  const disabledPaste = operations.length === 0;
  return (
    <>
      {showCopyAndDelete && (
        <>
          <ContextMenuItem
            disabled={disabled}
            onClick={() => {
              copySelectedNodes(selectedNodes, flowVersion);
            }}
          >
            <div className="flex gap-2 items-center">
              <Copy className="w-4 h-4"></Copy> {t('Copy')}
            </div>
          </ContextMenuItem>
          <ContextMenuItem
            disabled={disabled}
            onClick={() => {
              deleteSelectedNodes(
                selectedNodes,
                applyOperation,
                selectedStep,
                exitStepSettings,
              );
            }}
          >
            <div className="flex gap-2 items-center text-destructive">
              <Trash className="w-4 stroke-destructive h-4"></Trash>{' '}
              {t('Delete')}
            </div>
          </ContextMenuItem>
        </>
      )}

      {!readonly && (
        <>
          {showPasteAfterLastStep && (
            <ContextMenuItem
              disabled={disabledPaste}
              onClick={() => {
                const lastStep = flowStructureUtil
                  .getAllStepsAtFirstLevel(flowVersion.trigger)
                  .at(-1);
                if (lastStep) {
                  pasteNodes(
                    operations,
                    flowVersion,
                    {
                      parentStepName: lastStep.name,
                      stepLocationRelativeToParent:
                        StepLocationRelativeToParent.AFTER,
                    },
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
                  operations,
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
                  operations,
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
