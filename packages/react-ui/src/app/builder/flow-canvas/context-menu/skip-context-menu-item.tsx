import { t } from 'i18next';
import { Route, RouteOff } from 'lucide-react';

import { ContextMenuItem } from '@/components/ui/context-menu';
import { Action, flowStructureUtil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { toggleSkipSelectedNodes } from '../bulk-actions';

import { CanvasShortcuts } from './canvas-context-menu';
import { ShortcutWrapper } from './shortcut-wrapper';

export const SkipContextMenuItem = () => {
  const [selectedNodes, flowVersion, applyOperation, readonly] =
    useBuilderStateContext((state) => [
      state.selectedNodes,
      state.flowVersion,
      state.applyOperation,
      state.readonly,
    ]);
  const areAllStepsSkipped = selectedNodes.every(
    (node) =>
      !!(flowStructureUtil.getStep(node, flowVersion.trigger) as Action)?.skip,
  );
  const doSelectedNodesIncludeTrigger = selectedNodes.some(
    (node) => node === flowVersion.trigger.name,
  );

  const showSkip = !doSelectedNodesIncludeTrigger && !readonly;

  if (!showSkip) return null;
  return (
    <ContextMenuItem
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
  );
};
