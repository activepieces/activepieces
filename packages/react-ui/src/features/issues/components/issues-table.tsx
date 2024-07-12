import { DataTable, RowDataWithActions } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { authenticationSession } from "@/features/authentication/lib/authentication-session"
import { Issue } from "@activepieces/ee-shared"
import { ColumnDef } from "@tanstack/react-table"
import { issuesApi } from "../api/issues-api"


const columns: ColumnDef<RowDataWithActions<Issue>>[] = [
    {
        accessorKey: "flowName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="FlowName" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.flowId}</div>
        },
    },
    {
        accessorKey: "count",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Count" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.count}</div>
        },
    },
    {
        accessorKey: "created",
        header: ({ column }) => <DataTableColumnHeader column={column} title="First Seen" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.created}</div>
        },
    },
    {
        accessorKey: "lastOccurrence",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Seen" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.lastOccurrence}</div>
        },
    },
]

const fetchData = async (pagination: { cursor?: string, limit: number }) => {
    return issuesApi.list({
        projectId: authenticationSession.getProjectId(),
        cursor: pagination.cursor,
        limit: pagination.limit,
    })
}

export default function IssuesTable() {
    return (
        <div className="container mx-auto py-10 flex-col">
            <div className="flex mb-4">
                <h1 className="text-3xl font-bold">Issues </h1>
                <div className="ml-auto">
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}