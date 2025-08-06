import { t } from 'i18next';
import { ClipboardPlus } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';

import { useBuilderStateContext } from '../../builder-hooks';
import { getLastLocationAsPasteLocation, pasteNodes } from '../bulk-actions';

export const PasteAfterLastStepContextMenuItem = () => {
  const [flowVersion, applyOperation] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.applyOperation,
  ]);
  return (
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
  );
};
