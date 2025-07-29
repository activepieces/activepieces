import { t } from 'i18next';
import { Copy } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';

import { useBuilderStateContext } from '../../builder-hooks';
import { copySelectedNodes } from '../bulk-actions';

import { CanvasShortcuts } from './canvas-context-menu';
import { ShortcutWrapper } from './shortcut-wrapper';

export const CopyContextMenuItem = () => {
  const [selectedNodes, flowVersion] = useBuilderStateContext((state) => [
    state.selectedNodes,
    state.flowVersion,
  ]);
  const doSelectedNodesIncludeTrigger = selectedNodes.some(
    (node) => node === flowVersion.trigger.name,
  );
  const showCopy = !doSelectedNodesIncludeTrigger;
  if (!showCopy) return null;
  return (
    <ContextMenuItem
      onClick={() => {
        copySelectedNodes({ selectedNodes, flowVersion });
      }}
    >
      <ShortcutWrapper shortcut={CanvasShortcuts['Copy']}>
        <Copy className="w-4 h-4"></Copy> {t('Copy')}
      </ShortcutWrapper>
    </ContextMenuItem>
  );
};
