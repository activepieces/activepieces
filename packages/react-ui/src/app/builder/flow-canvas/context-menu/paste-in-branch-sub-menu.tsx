import { ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuItem } from "@/components/ui/context-menu";
import { pasteNodes } from "../bulk-actions";
import { ClipboardPaste } from "lucide-react";
import { t } from "i18next";

import { useBuilderStateContext } from "../../builder-hooks";
import { ActionType, FlowOperationType, flowStructureUtil, StepLocationRelativeToParent } from "@activepieces/shared";

export const PasteInBranchSubMenu = () => {
    const [
        selectedNodes,
        flowVersion,
        applyOperation,
    ] = useBuilderStateContext((state) => [
        state.selectedNodes,
        state.flowVersion,
        state.applyOperation,
    ]);
    const firstSelectedStep = flowStructureUtil.getStep(
        selectedNodes[0],
        flowVersion.trigger,
      );

      if(firstSelectedStep?.type !== ActionType.ROUTER) return null;

    return (<ContextMenuSub>
    <ContextMenuSubTrigger className="flex items-center gap-2">
      <ClipboardPaste className="w-4 h-4"></ClipboardPaste>{' '}
      {t('Paste Inside...')}
    </ContextMenuSubTrigger>
    <ContextMenuSubContent>
      {firstSelectedStep &&
        firstSelectedStep.settings.branches.map(
          (branch, branchIndex) => (
            <ContextMenuItem
              key={branch.branchName}
              onClick={() => {
                pasteNodes(
                  flowVersion,
                  {
                    parentStepName: selectedNodes[0],
                    stepLocationRelativeToParent:
                      StepLocationRelativeToParent.INSIDE_BRANCH,
                    branchIndex,
                  },
                  applyOperation,
                );
              }}
            >
              {branch.branchName}
            </ContextMenuItem>
          ),
        )}
      <ContextMenuItem
        onClick={() => {
          applyOperation({
            type: FlowOperationType.ADD_BRANCH,
            request: {
              stepName: firstSelectedStep.name,
              branchIndex:
                firstSelectedStep.settings.branches.length - 1,
              branchName: `Branch ${firstSelectedStep.settings.branches.length}`,
            },
          });
          pasteNodes(
            flowVersion,
            {
              parentStepName: firstSelectedStep.name,
              stepLocationRelativeToParent:
                StepLocationRelativeToParent.INSIDE_BRANCH,
              branchIndex:
                firstSelectedStep.settings.branches.length - 1,
            },
            applyOperation,
          );
        }}
      >
        + {t('New Branch')}
      </ContextMenuItem>
    </ContextMenuSubContent>
  </ContextMenuSub>
)
}