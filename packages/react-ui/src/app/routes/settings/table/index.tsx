"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableViewer } from "./table-viewer"

export function DataTableViewer() {
  const [selectedDatabase, setSelectedDatabase] = React.useState("main")
  const [selectedTable, setSelectedTable] = React.useState("users")

  const tables = [
    { value: "users", label: "Users" },
    { value: "orders", label: "Orders" },
    { value: "products", label: "Products" },
  ]

  return (
    <div className="flex">
      <div className="w-1/5 p-4 space-y-4">
        <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select database" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Main Database</SelectItem>
            <SelectItem value="analytics">Analytics Database</SelectItem>
            <SelectItem value="archive">Archive Database</SelectItem>
          </SelectContent>
        </Select>
        <div className="space-y-2">
          {tables.map((table) => (
            <div
              key={table.value}
              className={`p-2 cursor-pointer text-sm ${selectedTable === table.value ? "bg-gray-200" : ""}`}
              onClick={() => setSelectedTable(table.value)}
            >
              {table.label}
            </div>
          ))}
        </div>
      </div>
      <div className="w-3/4 p-4">
        <TableViewer />
      </div>
    </div>
  )
}
