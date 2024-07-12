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
}

export function DataTable<TData, TValue>({
    columns,
    fetchData,
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
            <div className="ap-rounded-md ap-border">
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
                                <TableCell colSpan={columns.length} className="ap-h-24 ap-text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "ap-selected"}
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
                                <TableCell colSpan={columns.length} className="ap-h-24 ap-text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="ap-flex ap-ap-items-center ap-justify-end ap-space-x-2 ap-py-4">
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