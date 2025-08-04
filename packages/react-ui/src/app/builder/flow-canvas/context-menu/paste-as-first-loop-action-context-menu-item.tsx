import { t } from 'i18next';
import { ClipboardPaste } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';
import { StepLocationRelativeToParent } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { pasteNodes } from '../bulk-actions';

export const PasteAsFirstLoopActionContextMenuItem = () => {
  const [flowVersion, applyOperation, selectedNodes] = useBuilderStateContext(
    (state) => [state.flowVersion, state.applyOperation, state.selectedNodes],
  );

  return (
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
  );
};
