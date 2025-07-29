import { t } from 'i18next';
import { ClipboardPlus } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';
import { StepLocationRelativeToParent } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { pasteNodes } from '../bulk-actions';

export const PasteAfterCurrentStepContextMenuItem = () => {
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
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          },
          applyOperation,
        );
      }}
      className="flex items-center gap-2"
    >
      <ClipboardPlus className="w-4 h-4"></ClipboardPlus> {t('Paste After')}
    </ContextMenuItem>
  );
};
