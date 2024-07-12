import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { ColumnDef } from "@tanstack/react-table";
import { formatUtils } from "@/lib/utils";
import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { DataTable, RowDataWithActions } from "@/components/ui/data-table";
import { AppConnection } from "@activepieces/shared";
import { appConnectionsApi } from "@/features/connections/lib/flows-api";
import AppConnectionStatusComponent from "@/features/connections/components/flow-status-toggle";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash } from "lucide-react"
import { TextWithIcon } from "@/components/ui/text-with-icon";

const columns: ColumnDef<RowDataWithActions<AppConnection>>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
            return <div className="ap-text-left">{row.original.name}</div>
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            return <div className="ap-text-left"><AppConnectionStatusComponent status={row.original.status} /></div>
        },
    },
    {
        accessorKey: 'created',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => {
            return <div className="ap-text-left">{formatUtils.formatDate(new Date(row.original.created))}</div>
        },
    },
    {
        accessorKey: 'updated',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        cell: ({ row }) => {
            return <div className="ap-text-left">{formatUtils.formatDate(new Date(row.original.updated))}</div>
        },
    },
    {
        accessorKey: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => {
            return (
                <div className="ap-flex ap-items-end ap-justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                row.original.delete();
                            }}>
                                <TextWithIcon icon={<Trash />} text="Delete" className="ap-w-3 ap-h-3" />
        
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    }
]
const fetchData = async (pagination: { cursor?: string, limit: number }) => {
    return appConnectionsApi.list({
        projectId: authenticationSession.getProjectId(),
        cursor: pagination.cursor,
        limit: pagination.limit,
    })
}

export default function AppConnectionsTable() {
    return (
        <div className="ap-container ap-mx-auto ap-py-10 ap-flex-col">
            <div className="ap-flex ap-mb-4">
                <h1 className="ap-text-3xl ap-font-bold">Connections </h1>
                <div className="ap-ml-auto">
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}