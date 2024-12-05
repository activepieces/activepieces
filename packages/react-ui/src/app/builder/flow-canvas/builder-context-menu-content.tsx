import { ContextMenuItem } from "@/components/ui/context-menu"
import { t } from "i18next"
import { Trash } from "lucide-react"
import { ApNode } from "./types";
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BuilderState, RightSideBarType } from "../builder-hooks";
import { FlowOperationType } from "../../../../../shared/src";
import { INTERNAL_ERROR_TOAST, toast } from "@/components/ui/use-toast";

const BuilderContextMenuItemWrapper = ({ showTooltip, children }: { showTooltip: boolean, children: React.ReactNode }) => {
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

export const BuilderContextMenuContent = ({ selectedNodes, applyOperation, selectedStep, setRightSidebar }: { selectedNodes: ApNode[], applyOperation: BuilderState['applyOperation'], setRightSidebar: BuilderState['setRightSidebar'], selectedStep: BuilderState['selectedStep'] }) => {
    const disabled = selectedNodes.length === 0;

    return <BuilderContextMenuItemWrapper showTooltip={disabled}>
        <ContextMenuItem disabled={disabled} onClick={() => {
            selectedNodes.forEach(node => {
                if ('step' in node.data) {
                    applyOperation({
                        type: FlowOperationType.DELETE_ACTION,
                        request: {
                            name: node.data.step.name
                        }
                    }, () => {
                        toast(INTERNAL_ERROR_TOAST);
                    })
                    if (selectedStep === node.data.step.name) {
                        setRightSidebar(RightSideBarType.NONE);
                    }
                }
            })
        }}>
            <div className="flex gap-2 items-center text-destructive">
                <Trash className="w-4 stroke-destructive h-4"></Trash> {t('Delete')}
            </div>
        </ContextMenuItem>
    </BuilderContextMenuItemWrapper>
}