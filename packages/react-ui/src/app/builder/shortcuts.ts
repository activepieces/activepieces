import { useCallback, useEffect } from 'react';

import {
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import { useBuilderStateContext } from './builder-hooks';
import {
  CanvasShortcuts,
  CanvasShortcutsProps,
} from './flow-canvas/context-menu/canvas-context-menu';
import { canvasBulkActions } from './flow-canvas/utils/bulk-actions';
import { flowCanvasConsts } from './flow-canvas/utils/consts';

export const useHandleKeyPressOnCanvas = () => {
  const [
    selectedNodes,
    flowVersion,
    selectedStep,
    exitStepSettings,
    applyOperation,
    readonly,
    setShowMinimap,
    showMinimap,
  ] = useBuilderStateContext((state) => [
    state.selectedNodes,
    state.flowVersion,
    state.selectedStep,
    state.exitStepSettings,
    state.applyOperation,
    state.readonly,
    state.setShowMinimap,
    state.showMinimap,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target === document.body ||
          e.target.classList.contains(
            flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME,
          ) ||
          e.target.closest(
            `[data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}]`,
          )) &&
        !readonly
      ) {
        const selectedNodesWithoutTrigger = selectedNodes.filter(
          (node) => node !== flowVersion.trigger.name,
        );
        shortcutHandler(e, {
          Minimap: () => {
            setShowMinimap(!showMinimap);
          },
          Copy: () => {
            if (
              selectedNodesWithoutTrigger.length > 0 &&
              document.getSelection()?.toString() === ''
            ) {
              canvasBulkActions.copySelectedNodes({
                selectedNodes: selectedNodesWithoutTrigger,
                flowVersion,
              });
            }
          },
          Delete: () => {
            if (selectedNodes.length > 0) {
              canvasBulkActions.deleteSelectedNodes({
                exitStepSettings,
                selectedStep,
                selectedNodes,
                applyOperation,
              });
            }
          },
          Skip: () => {
            if (selectedNodesWithoutTrigger.length > 0) {
              canvasBulkActions.toggleSkipSelectedNodes({
                selectedNodes: selectedNodesWithoutTrigger,
                flowVersion,
                applyOperation,
              });
            }
          },
          Paste: () => {
            canvasBulkActions.getActionsInClipboard().then((actions) => {
              if (actions.length > 0) {
                const lastStep = [
                  flowVersion.trigger,
                  ...flowStructureUtil.getAllNextActionsWithoutChildren(
                    flowVersion.trigger,
                  ),
                ].at(-1)!.name;
                const lastSelectedNode =
                  selectedNodes.length === 1 ? selectedNodes[0] : null;
                canvasBulkActions.pasteNodes(
                  flowVersion,
                  {
                    parentStepName: lastSelectedNode ?? lastStep,
                    stepLocationRelativeToParent:
                      StepLocationRelativeToParent.AFTER,
                  },
                  applyOperation,
                );
              }
            });
          },
        });
      }
    },
    [
      selectedNodes,
      flowVersion,
      applyOperation,
      selectedStep,
      exitStepSettings,
      readonly,
      setShowMinimap,
      showMinimap,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
const shortcutHandler = (
  event: KeyboardEvent,
  handlers: Record<keyof CanvasShortcutsProps, () => void>,
) => {
  const shortcutActivated = Object.entries(CanvasShortcuts).find(
    ([_, shortcut]) =>
      shortcut.shortcutKey?.toLowerCase() === event.key.toLowerCase() &&
      !!(
        shortcut.withCtrl === event.ctrlKey ||
        shortcut.withCtrl === event.metaKey
      ) &&
      !!shortcut.withShift === event.shiftKey,
  );
  if (shortcutActivated) {
    if (
      isNil(shortcutActivated[1].shouldNotPreventDefault) ||
      !shortcutActivated[1].shouldNotPreventDefault
    ) {
      event.preventDefault();
    }
    event.stopPropagation();
    handlers[shortcutActivated[0] as keyof CanvasShortcutsProps]();
  }
};
