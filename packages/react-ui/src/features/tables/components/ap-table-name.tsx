import { useQueryClient } from "@tanstack/react-query"
import { tableHooks } from "../lib/ap-tables-hooks"
import EditableText from "@/components/ui/editable-text"
import { useTableState } from "./ap-table-state-provider"
import { useAuthorization } from "@/hooks/authorization-hooks"
import { Permission } from "@activepieces/shared"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"


const ApTableName = ({tableId, tableName, isEditingTableName, setIsEditingTableName}: {tableId: string , tableName: string, isEditingTableName: boolean, setIsEditingTableName: (val:boolean) => void}) => {
    const queryClient = useQueryClient()
    const enqueueMutation = useTableState((state) => state.enqueueMutation)
    const updateTableMutation = tableHooks.useUpdateTable({
        queryClient,
        tableId,
    })
    const isReadOnly =  !useAuthorization().checkAccess(Permission.WRITE_TABLE)
    
    return <div  onClick={()=>{
        if(!isReadOnly && !isEditingTableName){
            setIsEditingTableName(true)
        }
    }} className={cn("flex items-center gap-2" )} >
        <EditableText value={tableName} readonly={isReadOnly} onValueChange={(newName) => {
        enqueueMutation(updateTableMutation, {
            name: newName,
        })
    }} isEditing={isEditingTableName} setIsEditing={setIsEditingTableName} />
     {
        !isReadOnly && !isEditingTableName && <Pencil className="w-4 h-4" />
     }
    </div>
}

ApTableName.displayName = 'ApTableName'

export default ApTableName