"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ColumnType, ColumnTypeSelector } from "./column-type-selector"
import { Text, PlusSquare, Hash, Calendar } from "lucide-react"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

const initialData = [
  {
    id: "m5gr84i9",
    status: "success",
    email: "ken99@yahoo.com",
  },
  {
    id: "3u1reuv4",
    status: "success",
    email: "Abe45@gmail.com",
  },
  {
    id: "derv1ws0",
    status: "processing",
    email: "Monserrat44@gmail.com",
  },
  {
    id: "5kma53ae",
    status: "success",
    email: "Silas22@gmail.com",
  },
  {
    id: "bhqecj4p",
    status: "failed",
    email: "carmella@hotmail.com",
  },
]

export function TableViewer() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [data, setData] = React.useState(initialData)
  const [schema, setSchema] = React.useState([
    { type: "select", name: "Select" },
    { type: "text", name: "Status" },
    { type: "addColumn", name: "Add Column" },
  ]);

  const constructColumns = (schema: { type: string; name: string }[]): ColumnDef<unknown>[] => {
    return schema.map((column) => {
      if (column.type === "select") {
        return {
          id: "select",
          header: ({ table }: { table: any }) => (
            <div className="flex items-center">
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            </div>
          ),
          cell: ({ row }: { row: any }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        }
      } else if (column.type === ColumnType.Text) {
        return {
          accessorKey: "status",
          header: ({ column }: { column: any }) => (
              <DataTableColumnHeader title="Status" icon={<Text size={16}/>} column={column} />
          ),
          cell: ({ row }: { row: any }) => (
            <div className="capitalize">{row.getValue("status")}</div>
          ),
        }
      } else if (column.type === ColumnType.Number) {
        return {
          accessorKey: "number",
          header: ({ column }: { column: any }) => (
            <DataTableColumnHeader title="Number" icon={<Hash size={16}/>} column={column} />
          ),
          cell: ({ row }: { row: any }) => (
            <div>{row.getValue("number")}</div>
          ),
        }
      } else if (column.type === ColumnType.Date) {
        return {
          accessorKey: "date",
          header: ({ column }: { column: any }) => (
            <DataTableColumnHeader title="Date" icon={<Calendar size={16}/>} column={column} />
          ),
          cell: ({ row }: { row: any }) => (
            <div>{row.getValue("date")}</div>
          ),
        }
      } else if (column.type === "addColumn") {
        return {
          id: "addColumn",
          header: () => (
            <div className="flex items-center">
              <ColumnTypeSelector onAddColumn={addColumn} />
            </div>
          ),
          cell: () => null, // Empty cell for rows
        }
      } else {
        return {
          accessorKey: column.type,
          header: () => (
            <div className="flex items-center">
              <PlusSquare className="mr-2" />
              {column.type.charAt(0).toUpperCase() + column.type.slice(1)}
            </div>
          ),
          cell: ({ row }: { row: any }) => <div>{row.getValue(column.type)}</div>,
        }
      }
    }).filter(Boolean) as ColumnDef<unknown>[]
  }

  const [columns, setColumns] = React.useState<ColumnDef<unknown>[]>(constructColumns(schema));

  const addColumn = (type: ColumnType) => {
    const newColumn = { type: type, name: type.charAt(0).toUpperCase() + type.slice(1) };
    setSchema((prevSchema) => {
      const updatedSchema = [
        ...prevSchema.slice(0, -1),
        newColumn,
        ...prevSchema.slice(-1)
      ];
      setColumns(constructColumns(updatedSchema));
      return updatedSchema;
    });
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
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
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}
