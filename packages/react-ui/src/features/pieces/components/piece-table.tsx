import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, RowDataWithActions } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react"
import { PieceIcon } from "@/features/pieces/components/piece-icon";
import { piecesApi } from "../lib/pieces-api";
import { PieceMetadataModelSummary } from "@activepieces/pieces-framework";

const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="App" />,
        cell: ({ row }) => {
            return <div className="text-left"><PieceIcon pieceName={row.original.name} /></div>
        },
    },
    {
        accessorKey: "displayName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Display Name" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.displayName}</div>
        },
    },
    {
        accessorKey: 'packageName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Package Name" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.name}</div>
        },
    },
    {
        accessorKey: 'version',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Version" />,
        cell: ({ row }) => {
            return <div className="text-left">{row.original.version}</div>
        },
    },
    {
        accessorKey: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
        cell: ({ row }) => {
            return (
                <div className="flex items-end justify-end">
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                        row.original.delete();
                    }}>
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    }
]
const fetchData = async () => {
    const pieces = await piecesApi.list({
        includeHidden: true,
    })
    return {
        data: pieces,
        next: null,
        previous: null,
    }
}

export default function PiecesTable() {
    return (
        <div className="mx-auto w-full py-10 flex-col">
            <div className="flex mb-4">
                <h1 className="text-3xl font-bold">Pieces </h1>
                <div className="ml-auto">
                </div>
            </div>
            <DataTable columns={columns} fetchData={fetchData} />
        </div>
    )
}