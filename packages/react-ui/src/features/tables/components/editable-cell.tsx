import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { CalculatedColumn } from 'react-data-grid';

import { Button } from '@/components/ui/button';
import { cn, formatUtils } from '@/lib/utils';
import { FieldType, isNil } from '@activepieces/shared';

import { Row } from '../lib/types';

import { useTableState } from './ap-table-state-provider';
import { DateEditor } from './date-editor';
import { TextEditor } from './text-editor';

type EditableCellProps = {
  type: FieldType;
  value: string;
  row: Row;
  column: CalculatedColumn<Row, { id: string }>;
  onRowChange: (row: Row, commitChanges: boolean) => void;
  rowIdx: number;
  disabled?: boolean;
};

const EditorSelector = ({
  type,
  row,
  rowIdx,
  column,
  value,
  onRowChange,
  setValue,
  setIsEditing,
  setIsHovered,
}: {
  type: FieldType;
  row: Row;
  rowIdx: number;
  column: CalculatedColumn<Row, { id: string }>;
  value: string;
  onRowChange: (row: Row, commitChanges: boolean) => void;
  setValue: (value: string) => void;
  setIsEditing: (isEditing: boolean) => void;
  setIsHovered: (isHovered: boolean) => void;
}) => {
  let Editor;
  switch (type) {
    case FieldType.DATE:
      Editor = DateEditor;
      break;
    default:
      Editor = TextEditor; // TextEditor is used for numbers too
  }

  return (
    <Editor
      row={row}
      rowIdx={rowIdx}
      column={column}
      type={type}
      value={value}
      onRowChange={(newRow, commitChanges) => {
        if (commitChanges) {
          setValue(newRow[column.key]);
          onRowChange(newRow, commitChanges);
          setIsEditing(false);
        }
      }}
      onClose={() => {
        setIsEditing(false);
        setIsHovered(false);
      }}
    />
  );
};
export function EditableCell({
  type,
  value: initialValue,
  row,
  column,
  onRowChange,
  rowIdx,
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCell, setSelectedCell] = useTableState((state) => [
    state.selectedCell,
    state.setSelectedCell,
  ]);
  const [value, setValue] = useState(initialValue);
  const isSelected =
    selectedCell?.rowIdx === rowIdx && selectedCell?.columnIdx === column.idx;
  if (isEditing) {
    return (
      <EditorSelector
        type={type}
        row={row}
        rowIdx={rowIdx}
        column={column}
        value={value}
        onRowChange={onRowChange}
        setValue={setValue}
        setIsEditing={setIsEditing}
        setIsHovered={setIsHovered}
      />
    );
  }

  return (
    <div
      id={`editable-cell-${rowIdx}-${column.idx}`}
      className={cn(
        'h-full flex items-center justify-between gap-2 pl-2 py-2  focus:outline-none  ',
        'group cursor-pointer border',
        isSelected ? 'border-primary' : 'border-transparent',
      )}
      onMouseEnter={() => {
        if (!disabled) {
          setIsHovered(true);
        }
      }}
      tabIndex={0}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        setSelectedCell({ rowIdx, columnIdx: column.idx });
      }}
      onFocus={() => {
        setSelectedCell({ rowIdx, columnIdx: column.idx });
      }}
      onDoubleClick={() => {
        if (!disabled) {
          setIsEditing(true);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !disabled) {
          setIsEditing(true);
        }
      }}
    >
      <span className="flex-1 truncate">
        {type === FieldType.DATE && !isNil(value)
          ? formatUtils.formatDateOnlyOrFail(new Date(value), '')
          : value}
      </span>
      {isHovered && (
        <Button
          variant="transparent"
          size="sm"
          className="text-gray-500"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <div className="hover:bg-primary/10 p-1">
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      )}
    </div>
  );
}
