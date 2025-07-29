import { ContextMenuItem } from "@/components/ui/context-menu";
import { toggleSkipSelectedNodes } from "../bulk-actions";
import { useBuilderStateContext } from "../../builder-hooks";
import { ShortcutWrapper } from "./shortcut-wrapper";
import { CanvasShortcuts, ContextMenuType } from "./canvas-context-menu";
import { Route, RouteOff } from "lucide-react";
import { Action, flowStructureUtil } from "@activepieces/shared";
import { t } from "i18next";

export const SkipContextMenuItem = ({
    contextMenuType,
}: {
    contextMenuType: ContextMenuType;
}) => {
    const [
        selectedNodes,
        flowVersion,
        applyOperation,
        readonly,
      ] = useBuilderStateContext((state) => [
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

      const showSkip =
    !doSelectedNodesIncludeTrigger &&
    contextMenuType === ContextMenuType.STEP &&
    !readonly;

    if(!showSkip) return null;
    return (<ContextMenuItem
        onClick={() => {
          toggleSkipSelectedNodes({
            selectedNodes,
            flowVersion,
            applyOperation,
          });
        }}> 
         <ShortcutWrapper shortcut={CanvasShortcuts['Skip']}>
              {areAllStepsSkipped ? (
                <Route className="h-4 w-4"></Route>
              ) : (
                <RouteOff className="h-4 w-4"></RouteOff>
              )}
              {t(areAllStepsSkipped ? 'Unskip' : 'Skip')}
            </ShortcutWrapper>
          </ContextMenuItem>
    
    )
}