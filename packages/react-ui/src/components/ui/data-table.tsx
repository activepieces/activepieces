"use client"

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from "./button";
import { SeekPage } from "@activepieces/shared";
import { useSearchParams } from "react-router-dom";

export type RowDataWithActions<TData> = TData & {
    delete: () => void;
};

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
    fetchData: (pagination: { cursor?: string, limit: number }) => Promise<SeekPage<TData>>;
    onRowClick?: (row: RowDataWithActions<TData>) => void;
}

export function DataTable<TData, TValue>({
    columns,
    fetchData,
    onRowClick,
}: DataTableProps<TData, TValue>) {

    const [searchParams, setSearchParams] = useSearchParams();
    const startingCursor = searchParams.get('cursor') || undefined;
    const [currentCursor, setCurrentCursor] = useState<string | undefined>(startingCursor);
    const [nextPageCursor, setNextPageCursor] = useState<string | undefined>(undefined);
    const [previousPageCursor, setPreviousPageCursor] = useState<string | undefined>(undefined);
    const [tableData, setTableData] = useState<RowDataWithActions<TData>[]>([]);
    const [deletedRows = [], setDeletedRows] = useState<TData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const table = useReactTable({
        data: tableData,
        columns,
        manualPagination: true,
        getCoreRowModel: getCoreRowModel(),
    });

    useEffect(() => {
        if (currentCursor) {
            setSearchParams({ cursor: currentCursor });
        }
        setLoading(true);
        setTableData([]);
        fetchData({ cursor: currentCursor, limit: 10 }).then(response => {
            const newData = response.data.map(row => ({
                ...row, delete: () => {
                    setDeletedRows(deletedRows.concat(row));
                },
            }))
            setTableData(newData);
            setNextPageCursor(response.next ?? undefined);
            setPreviousPageCursor(response.previous ?? undefined);
            setLoading(false);
        });
    }, [currentCursor]);

    useEffect(() => {
        setTableData(tableData.filter(row => !deletedRows.some(deletedRow => JSON.stringify(deletedRow) === JSON.stringify(row))));
    }, [deletedRows]);

    return (
        <div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    onClick={() => onRowClick?.(row.original)}
                                    key={row.id}
                                    className={onRowClick ? "cursor-pointer" : ""}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCursor(previousPageCursor)}
                    disabled={!previousPageCursor}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentCursor(nextPageCursor)}
                    disabled={!nextPageCursor}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}