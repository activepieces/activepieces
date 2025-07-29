import { t } from 'i18next';
import { Trash } from 'lucide-react';

import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

import { useBuilderStateContext } from '../../builder-hooks';
import { deleteSelectedNodes } from '../bulk-actions';

import { CanvasShortcuts } from './canvas-context-menu';
import { ShortcutWrapper } from './shortcut-wrapper';

export const DeleteContextMenuItem = () => {
  const [
    readonly,
    selectedNodes,
    applyOperation,
    selectedStep,
    exitStepSettings,
  ] = useBuilderStateContext((state) => [
    state.readonly,
    state.selectedNodes,
    state.applyOperation,
    state.selectedStep,
    state.exitStepSettings,
  ]);

  const isTriggerTheOnlySelectedNode =
    selectedNodes.length === 1 && selectedNodes[0] === 'trigger';
  const showDelete = !readonly && !isTriggerTheOnlySelectedNode;

  if (!showDelete) return null;

  return (
    <>
      <ContextMenuSeparator />
      <ContextMenuItem
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
  );
};
