import {
  ContextMenuContent,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { ActionType, flowStructureUtil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

import { CanvasContextMenuProps, ContextMenuType } from './canvas-context-menu';
import { CopyContextMenuItem } from './copy-context-menu-item';
import { CopyIdContextMenuItem } from './copy-id-context-menu-item';
import { DeleteContextMenuItem } from './delete-context-menu-item';
import { DuplicateContextMenuItem } from './duplicate-context-menu-item';
import { PasteAfterCurrentStepContextMenuItem } from './paste-after-current-step-context-menu-item';
import { PasteAfterLastStepContextMenuItem } from './paste-after-last-step-context-menu-item';
import { PasteAsFirstLoopActionContextMenuItem } from './paste-as-first-loop-action-context-menu-item';
import { PasteInBranchSubMenu } from './paste-in-branch-sub-menu';
import { ReplaceContextMenuItem } from './replace-context-menu-item';
import { SkipContextMenuItem } from './skip-context-menu-item';

export const CanvasContextMenuContent = ({
  contextMenuType,
}: CanvasContextMenuProps) => {
  const [selectedNodes, flowVersion, readonly] = useBuilderStateContext(
    (state) => [state.selectedNodes, state.flowVersion, state.readonly],
  );

  const firstSelectedStep = flowStructureUtil.getStep(
    selectedNodes[0],
    flowVersion.trigger,
  );
  const showPasteAfterLastStep =
    !readonly && contextMenuType === ContextMenuType.CANVAS;
  const showPasteAsFirstLoopAction =
    selectedNodes.length === 1 &&
    firstSelectedStep?.type === ActionType.LOOP_ON_ITEMS &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
  const showPasteAsBranchChild =
    selectedNodes.length === 1 &&
    firstSelectedStep?.type === ActionType.ROUTER &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
  const showPasteAfterCurrentStep =
    selectedNodes.length === 1 &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
  const isStepContextMenu = contextMenuType === ContextMenuType.STEP;
  const isTriggerOnlySelected =
    selectedNodes.length === 1 && firstSelectedStep?.name === 'trigger';
  if (isTriggerOnlySelected && readonly) {
    return null;
  }
  return (
    <ContextMenuContent>
      {isStepContextMenu && (
        <>
          <ReplaceContextMenuItem />
          <CopyContextMenuItem />
          <DuplicateContextMenuItem />
          <SkipContextMenuItem />
        </>
      )}

      {(showPasteAsFirstLoopAction ||
        showPasteAsBranchChild ||
        showPasteAfterCurrentStep) && (
        <ContextMenuSeparator></ContextMenuSeparator>
      )}

      {showPasteAfterLastStep && <PasteAfterLastStepContextMenuItem />}

      {showPasteAsFirstLoopAction && <PasteAsFirstLoopActionContextMenuItem />}

      {showPasteAfterCurrentStep && <PasteAfterCurrentStepContextMenuItem />}

      {showPasteAsBranchChild && <PasteInBranchSubMenu />}
      {isStepContextMenu && (
        <>
          <CopyIdContextMenuItem />
          <DeleteContextMenuItem />
        </>
      )}
    </ContextMenuContent>
  );
};
