import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { ColumnDef } from "@tanstack/react-table";
import { FlowRun } from "@activepieces/shared";
import { formatUtils } from "@/lib/utils";
import { flowRunsApi } from "@/features/flow-runs/lib/flow-runs-api";
import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { DataTable } from "@/components/ui/data-table";
import FlowRunStatusComponent from "@/features/flow-runs/components/flow-run-status";

const columns: ColumnDef<FlowRun>[] = [
    {
        accessorKey: "flowDisplayName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Flow" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.flowDisplayName}</div>
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            return <div className="text-left"><FlowRunStatusComponent status={row.original.status} /></div>
        },
    },
    {
        accessorKey: 'startTime',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start Time" />,
        cell: ({ row }) => {
            return <div className="text-left">{formatUtils.formatDate(new Date(row.original.startTime))}</div>
        },
    },
    {
        accessorKey: 'duration',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
        cell: ({ row }) => {
            return <div className="text-left">{formatUtils.formatDuration(row.original.duration)}</div>
        },
    }
]


const fetchData = async (pagination: { cursor?: string, limit: number }) => {
    return flowRunsApi.list({
        projectId: authenticationSession.getProjectId(),
        cursor: pagination.cursor,
        limit: pagination.limit,
    })
}

export default function FlowRunsTable() {
    return (
        <div className="container mx-auto py-10 flex-col">
            <div className="flex mb-4">
                <h1 className="text-3xl font-bold">Flow Runs</h1>
                <div className="ml-auto">
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}