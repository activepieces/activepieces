import { ContextMenuItem } from "@/components/ui/context-menu";
import { t } from "i18next";
import { useBuilderStateContext } from "../../builder-hooks";
import { ArrowLeftRight } from "lucide-react";
import { ContextMenuType } from "./canvas-context-menu";

export const ReplaceContextMenuItem = ({
    contextMenuType,
}: {
    contextMenuType: ContextMenuType;
}) => {
    const [
        selectedNodes,
        readonly,
        setOpenedPieceSelectorStepNameOrAddButtonId,
      ] = useBuilderStateContext((state) => [
        state.selectedNodes,
        state.readonly,
        state.setOpenedPieceSelectorStepNameOrAddButtonId,
      ]);
    const showReplace =
    selectedNodes.length === 1 &&
    !readonly &&
    contextMenuType === ContextMenuType.STEP;
    if(!showReplace) return null;

    return (
        <ContextMenuItem
          onClick={() => {
            setOpenedPieceSelectorStepNameOrAddButtonId(selectedNodes[0]);
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4"></ArrowLeftRight> {t('Replace')}
        </ContextMenuItem>
    )

}