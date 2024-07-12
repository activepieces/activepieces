import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { PopulatedFlow } from "@activepieces/shared"
import { PieceIconList } from "@/features/pieces/components/piece-icon-list"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import FlowStatusToggle from "@/features/flows/components/flow-status-toggle"
import { flowsApi } from "@/features/flows/lib/flows-api"
import { authenticationSession } from "@/features/authentication/lib/authentication-session"
import { formatUtils } from "@/lib/utils"

const columns: ColumnDef<PopulatedFlow>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
            const status = row.original.version.displayName
            return <div className="text-left">{status}</div>
        },
    },
    {
        accessorKey: "steps",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Steps" />,
        cell: ({ row }) => {
            return <>
                <PieceIconList flow={row.original} />
            </>
        },
    },
    {
        accessorKey: "created",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => {
            const created = row.original.created
            return <div className="text-left font-medium">{formatUtils.formatDate(new Date(created))}</div>
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            return <>
                <FlowStatusToggle flow={row.original} />
            </>
        }
    }

]

async function fetchData(pagination: { cursor?: string, limit: number }) {
    return flowsApi.list({
        projectId: authenticationSession.getProjectId(),
        cursor: pagination.cursor,
        limit: pagination.limit,
    })
}

export default function FlowsTable() {

    return (
        <div className="container mx-auto py-10 flex-col">
            <div className="flex mb-4">
                <h1 className="text-3xl font-bold">Flows</h1>
                <div className="ml-auto">
                    <Link to='/builder'>
                        <Button variant="default" >New flow</Button>
                    </Link>
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}