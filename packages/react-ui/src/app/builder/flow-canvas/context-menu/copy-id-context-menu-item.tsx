import { t } from 'i18next';
import { Copy } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';

import { useBuilderStateContext } from '../../builder-hooks';

export const CopyIdContextMenuItem = () => {
  const [selectedNodes] = useBuilderStateContext((state) => [
    state.selectedNodes,
  ]);
  const isTriggerTheOnlySelectedNode =
    selectedNodes.length === 1 && selectedNodes[0] === 'trigger';
  const showCopyId =
    !isTriggerTheOnlySelectedNode && selectedNodes.length === 1;
  if (!showCopyId) return null;
  return (
    <ContextMenuItem
      className="flex items-center gap-2"
      onClick={() => {
        navigator.clipboard.writeText(selectedNodes[0]);
      }}
    >
      <Copy className="w-4 h-4"></Copy> {t('Copy ID')}
    </ContextMenuItem>
  );
};
