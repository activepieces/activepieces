import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { tableHooks } from "../lib/ap-tables-hooks"
import EditableText from "@/components/ui/editable-text"
import { useTableState } from "./ap-table-state-provider"
import { useAuthorization } from "@/hooks/authorization-hooks"
import { Permission } from "@activepieces/shared"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"


const ApTableName = ({tableId, tableName}: {tableId: string , tableName: string}) => {
    const [isEditing, setIsEditing] = useState(false)
    const queryClient = useQueryClient()
    const enqueueMutation = useTableState((state) => state.enqueueMutation)
    const updateTableMutation = tableHooks.useUpdateTable({
        queryClient,
        tableId,
    })
    const isReadOnly =  !useAuthorization().checkAccess(Permission.WRITE_TABLE)

    return <div  onClick={()=>{
        if(!isReadOnly && !isEditing){
            setIsEditing(true)
        }
    }} className={cn("flex items-center gap-2" )} >
        <EditableText value={tableName} readonly={isReadOnly} onValueChange={(newName) => {
        enqueueMutation(updateTableMutation, {
            name: newName,
        })
    }} isEditing={isEditing} setIsEditing={setIsEditing} />
     {
        !isReadOnly && !isEditing && <Pencil className="w-4 h-4" />
     }
    </div>
}

ApTableName.displayName = 'ApTableName'

export default ApTableName