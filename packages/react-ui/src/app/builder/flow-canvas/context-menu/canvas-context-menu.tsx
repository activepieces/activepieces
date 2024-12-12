import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { BuilderState } from "../../builder-hooks";
import { ApButtonData, ApNode } from "../utils/types";
import { CanvasContextMenuContent } from "./canvas-context-menu-content";
import AddButtonsContextMenuContent from "./add-buttons-context-menu-content";


type CanvasContextMenuProps = Pick<BuilderState, 'applyOperation' | 'selectedStep' | 'flowVersion' | 'exitStepSettings' | 'readonly'> & {
    selectedNodes: ApNode[],
    children: React.ReactNode,
    contextMenuContentAddButtonData: ApButtonData | null
}
export const CanvasContextMenu = ({ selectedNodes, applyOperation, selectedStep,flowVersion,contextMenuContentAddButtonData, children, exitStepSettings, readonly }: CanvasContextMenuProps) => {

 return <ContextMenu modal={false}  >

    <ContextMenuTrigger asChild>
        {children}
    </ContextMenuTrigger>
    <ContextMenuContent >
       {
        !contextMenuContentAddButtonData &&
         <CanvasContextMenuContent 
         selectedNodes={selectedNodes} 
         applyOperation={applyOperation}
         selectedStep={selectedStep}
         flowVersion={flowVersion}
         exitStepSettings={exitStepSettings}
         readonly={readonly}
         />
       }
       {
        contextMenuContentAddButtonData && !readonly &&
        <AddButtonsContextMenuContent
         addButtonData={contextMenuContentAddButtonData} 
         applyOperation={applyOperation}
         flowVersion={flowVersion}/>
       }
    </ContextMenuContent>
 </ContextMenu>

}