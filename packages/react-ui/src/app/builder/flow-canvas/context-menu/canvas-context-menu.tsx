import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { BuilderState } from "../../builder-hooks";
import { ApButtonData, ApNode } from "../types";
import { CanvasContextMenuContent } from "./canvas-context-menu-content";
import AddButtonsContextMenuContent from "./add-buttons-context-menu-content";


type CanvasContextMenuProps = Pick<BuilderState, 'applyOperation' | 'selectedStep' | 'flowVersion' | 'exitStepSettings'> & {
    selectedNodes: ApNode[],
    children: React.ReactNode,
    contextMenuContentAddButtonData: ApButtonData | null
}
export const CanvasContextMenu = ({ selectedNodes, applyOperation, selectedStep,flowVersion,contextMenuContentAddButtonData, children, exitStepSettings }: CanvasContextMenuProps) => {

 return <ContextMenu >

    <ContextMenuTrigger asChild>
        {children}
    </ContextMenuTrigger>
    <ContextMenuContent>
       {
        !contextMenuContentAddButtonData &&
         <CanvasContextMenuContent 
         selectedNodes={selectedNodes} 
         applyOperation={applyOperation}
         selectedStep={selectedStep}
         flowVersion={flowVersion}
         exitStepSettings={exitStepSettings}
         />
       }
       {
        contextMenuContentAddButtonData &&
        <AddButtonsContextMenuContent
         addButtonData={contextMenuContentAddButtonData} 
         applyOperation={applyOperation}
         flowVersion={flowVersion}/>
       }
    </ContextMenuContent>
 </ContextMenu>

}