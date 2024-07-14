import { DataTable, RowDataWithActions } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { authenticationSession } from "@/features/authentication/lib/authentication-session"
import { PopulatedIssue } from "@activepieces/ee-shared"
import { ColumnDef } from "@tanstack/react-table"
import { issuesApi } from "../api/issues-api"
import { Button } from "@/components/ui/button"
import { formatUtils } from "@/lib/utils"
import { Check } from "lucide-react"

// TODO implement permissions here when done 
const handleMarkAsResolved = async (issueId: string, deleteRow: () => void) => {
    await issuesApi.resolve(issueId);
    deleteRow();
}

const columns: ColumnDef<RowDataWithActions<PopulatedIssue>>[] = [
    {
        accessorKey: "flowName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Flow Name" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.flowDisplayName}</div>
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
            return <div className="text-left">{formatUtils.formatDate(new Date(row.original.created))}</div>
        },
    },
    {
        accessorKey: "lastOccurrence",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Seen" />,
        cell: ({ row }) => {
            return <div className="text-left">{formatUtils.formatDate(new Date(row.original.lastOccurrence))}</div>
        },
    },
    {
        accessorKey: "actions",
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => {
            return (
                <div className="flex items-end justify-end">
                    <Button className="gap-2" size={"sm"} onClick={() => handleMarkAsResolved(row.original.id, row.original.delete)}>
                    <Check className="h-4 w-4" />
                    Mark as Resolved
                    </Button>
                </div>
            )
        },
    }
]

const fetchData = async (queryParams: URLSearchParams) => {
    const pagination: {
        cursor?: string
        limit?: number
    } = {
        cursor: queryParams.get('cursor') ?? undefined,
        limit: parseInt(queryParams.get('limit') ?? '10'),
    }

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
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold">Issues </h1>
                    <span className="text-md text-muted-foreground">Track failed runs grouped by flow name, and mark them as resolved when fixed.</span>
                </div>
                <div className="ml-auto">
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}