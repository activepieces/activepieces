import { ContextMenuItem } from "@/components/ui/context-menu";
import { Copy } from "lucide-react";
import { CanvasShortcuts, ContextMenuType } from "./canvas-context-menu";
import { t } from "i18next";
import { copySelectedNodes } from "../bulk-actions";
import { useBuilderStateContext } from "../../builder-hooks";
import { ShortcutWrapper } from "./shortcut-wrapper";

export const CopyContextMenuItem = ({
    contextMenuType,
}: {
    contextMenuType: ContextMenuType;
}) => {
    const [
        selectedNodes,
        flowVersion,
      ] = useBuilderStateContext((state) => [
        state.selectedNodes,
        state.flowVersion,
      ]);
      const doSelectedNodesIncludeTrigger = selectedNodes.some(
        (node) => node === flowVersion.trigger.name,
      );
    const showCopy =
    !doSelectedNodesIncludeTrigger && contextMenuType === ContextMenuType.STEP;
   if(!showCopy) return null;
    return ( <ContextMenuItem
        onClick={() => {
          copySelectedNodes({ selectedNodes, flowVersion });
        }}
      >
        <ShortcutWrapper shortcut={CanvasShortcuts['Copy']}>
          <Copy className="w-4 h-4"></Copy> {t('Copy')}
        </ShortcutWrapper>
      </ContextMenuItem>)
}