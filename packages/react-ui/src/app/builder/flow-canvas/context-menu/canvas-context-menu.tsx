import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { BuilderState } from "../../builder-hooks";
import { ApButtonData, ApNode } from "../types";
import { CanvasContextMenuContent } from "./canvas-context-menu-content";
import AddButtonsContextMenuContent from "./add-buttons-context-menu-content";


type CanvasContextMenuProps = {
    selectedNodes: ApNode[],
    applyOperation: BuilderState['applyOperation'],
    selectedStep: BuilderState['selectedStep'],
    setRightSidebar: BuilderState['setRightSidebar'],
    flowVersion: BuilderState['flowVersion'],
    children: React.ReactNode,
    contextMenuContentAddButtonData: ApButtonData | null
}
export const CanvasContextMenu = ({ selectedNodes, applyOperation, selectedStep, setRightSidebar,flowVersion,contextMenuContentAddButtonData, children }: CanvasContextMenuProps) => {

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
         setRightSidebar={setRightSidebar}
         flowVersion={flowVersion}
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