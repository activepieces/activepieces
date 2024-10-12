import * as React from "react"
import { Type, Hash, Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Add this enum
export enum ColumnType {
  Text = "text",
  Number = "number",
  Date = "date",
}

interface ColumnTypeSelectorProps {
  onAddColumn: (type: ColumnType) => void
}

export const ColumnTypeSelector: React.FC<ColumnTypeSelectorProps> = ({ onAddColumn }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Add column type</span>
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-4">
          <h4 className="font-medium leading-none">Select Column Type</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start" onClick={() => onAddColumn(ColumnType.Text)}>
              <Type className="mr-2 h-4 w-4" />
              Text
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => onAddColumn(ColumnType.Number)}>
              <Hash className="mr-2 h-4 w-4" />
              Number
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => onAddColumn(ColumnType.Date)}>
              <Calendar className="mr-2 h-4 w-4" />
              Date
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
