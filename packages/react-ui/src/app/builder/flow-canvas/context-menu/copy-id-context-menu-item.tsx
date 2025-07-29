import { useBuilderStateContext } from "../../builder-hooks";
import { ContextMenuType } from "./canvas-context-menu";
import { Copy } from "lucide-react";
import { t } from "i18next";
import { ContextMenuItem } from "@/components/ui/context-menu";

export const CopyIdContextMenuItem = ({
    contextMenuType,
}: {
    contextMenuType: ContextMenuType;
}) => {
    const [
        selectedNodes,
      ] = useBuilderStateContext((state) => [
        state.selectedNodes,
      ]);
 const isTriggerTheOnlySelectedNode = selectedNodes.length === 1 && selectedNodes[0] === 'trigger';
 const showCopyId = contextMenuType === ContextMenuType.STEP && !isTriggerTheOnlySelectedNode && selectedNodes.length === 1;
 if(!showCopyId) return null;
 return (
    <ContextMenuItem className='flex items-center gap-2' onClick={() => {
        navigator.clipboard.writeText(selectedNodes[0]);
      }}>
        <Copy className="w-4 h-4"></Copy> {t('Copy ID')}
      </ContextMenuItem>
 )
}