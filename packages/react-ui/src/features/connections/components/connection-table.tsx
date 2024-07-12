import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { ColumnDef } from "@tanstack/react-table";
import { formatUtils } from "@/lib/utils";
import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { DataTable, RowDataWithActions } from "@/components/ui/data-table";
import { AppConnection } from "@activepieces/shared";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react"
import { appConnectionsApi } from "@/features/connections/lib/app-connections-api";
import { PieceIcon } from "@/features/pieces/components/piece-icon";
import AppConnectionStatusComponent from "./connection-status-toggle";
import { ConfirmationDeleteDialog } from "@/components/delete-dialog";

const columns: ColumnDef<RowDataWithActions<AppConnection>>[] = [
    {
        accessorKey: "pieceName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="App" />,
        cell: ({ row }) => {
            return <div className="text-left"><PieceIcon pieceName={row.original.pieceName} /></div>
        },
    },
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.name}</div>
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            return <div className="text-left"><AppConnectionStatusComponent status={row.original.status} /></div>
        },
    },
    {
        accessorKey: 'created',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => {
            return <div className="text-left">{formatUtils.formatDate(new Date(row.original.created))}</div>
        },
    },
    {
        accessorKey: 'updated',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        cell: ({ row }) => {
            return <div className="text-left">{formatUtils.formatDate(new Date(row.original.updated))}</div>
        },
    },
    {
        accessorKey: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => {
            return (
                <div className="flex items-end justify-end">
                    <ConfirmationDeleteDialog
                        title={`Delete ${row.original.name} connection`}
                        message="Are you sure you want to delete this connection? all steps using it will fail."
                        onClose={() => { }}
                        onConfirm={() => { }}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </ConfirmationDeleteDialog>

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

function AppConnectionsTable() {
    return (
        <div className="container mx-auto py-10 flex-col">
            <div className="flex mb-4">
                <h1 className="text-3xl font-bold">Connections </h1>
                <div className="ml-auto">
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}
export { AppConnectionsTable };