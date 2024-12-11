import { ContextMenuItem } from "@/components/ui/context-menu"
import { t } from "i18next"
import { Copy, Trash } from "lucide-react"
import { ApNode } from "../types";
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BuilderState } from "../../builder-hooks";
import { copySelectedNodes } from "./copy-selected-nodes";
import { deleteSelectedNodes } from "./delete-selected-nodes";

type CanvasContextMenuContentProps = Pick<BuilderState, 'applyOperation' | 'selectedStep' | 'flowVersion' | 'exitStepSettings' | 'readonly'> & {
    selectedNodes: ApNode[]
};


const CanvasContextMenuItemWrapper = ({ showTooltip, children }: { showTooltip: boolean, children: React.ReactNode }) => {
    return <Tooltip >
        <TooltipTrigger asChild>
            <div>
                {children}

            </div>
        </TooltipTrigger>
        {
            showTooltip && <TooltipContent>
                {t("You need to select a step")}
            </TooltipContent>
        }
    </Tooltip>
}
export const CanvasContextMenuContent = ({ selectedNodes, applyOperation, selectedStep, flowVersion, exitStepSettings, readonly }: CanvasContextMenuContentProps) => {
    const disabled = selectedNodes.length === 0;
    return <>
     <CanvasContextMenuItemWrapper showTooltip={disabled}>
        <ContextMenuItem disabled={disabled} onClick={() => {
            copySelectedNodes(selectedNodes, flowVersion);
        }}>
            <div className="flex gap-2 items-center">
                <Copy className="w-4 h-4"></Copy> {t('Copy')}
            </div>
        </ContextMenuItem>
    </CanvasContextMenuItemWrapper>

{
    !readonly &&
    <CanvasContextMenuItemWrapper showTooltip={disabled}>
        <ContextMenuItem disabled={disabled} onClick={() => {
            deleteSelectedNodes(selectedNodes, applyOperation, selectedStep, exitStepSettings);
        }}>
            <div className="flex gap-2 items-center text-destructive">
                <Trash className="w-4 stroke-destructive h-4"></Trash> {t('Delete')}
            </div>
        </ContextMenuItem>
    </CanvasContextMenuItemWrapper>
}
    </>
}