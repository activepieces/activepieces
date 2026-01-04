import { NodeProps, NodeResizer } from "@xyflow/react";
import { ApNoteNode } from "../utils/types";
import { useNotesContext } from "../notes-context";

const ApNoteCanvasNode = (props: NodeProps & Omit<ApNoteNode, 'position'>) => {
    const { resizeNote } = useNotesContext();
    return (
        <>
         <NodeResizer onResize={(_,params)=>{
            resizeNote(props.id, {
                width: params.width,
                height: params.height,
            });
         }}></NodeResizer>
         <div className="rounded-md border bg-yellow-200 border-solid shadow-sm border-yellow-500 p-2" 
          style={{
            width: `${props.data.size.width}px`,
            height: `${props.data.size.height}px`,
          }}
         >
         
         </div></>
       
     )
}
ApNoteCanvasNode.displayName = 'ApNoteCanvasNode';
export default ApNoteCanvasNode;