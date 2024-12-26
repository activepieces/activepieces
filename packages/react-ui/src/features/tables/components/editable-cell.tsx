import { Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CalculatedColumn } from 'react-data-grid';

import { Button } from '@/components/ui/button';

import { TextEditor } from './text-editor';

type Row = {
  id: string;
  [key: string]: any;
};

type EditableCellProps = {
  value: string;
  row: Row;
  column: CalculatedColumn<Row, { id: string }>;
  onRowChange: (row: Row, commitChanges: boolean) => void;
  rowIdx: number;
};

export function EditableCell({
  value,
  row,
  column,
  onRowChange,
  rowIdx,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSelected &&
        !(event.target as HTMLElement).closest('.editable-cell')
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSelected]);

  if (isEditing) {
    return (
      <TextEditor
        row={row}
        rowIdx={rowIdx}
        column={column}
        onRowChange={(newRow, commitChanges) => {
          if (commitChanges) {
            onRowChange(newRow, commitChanges);
            setIsEditing(false);
          }
        }}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      className={`h-full relative flex items-center justify-between px-2 py-2 group cursor-pointer border editable-cell ${
        isSelected ? 'border-primary' : 'border-transparent'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsSelected(true)}
      onDoubleClick={() => setIsEditing(true)}
    >
      <span className="truncate">{value}</span>
      {isHovered && (
        <Button
          variant="transparent"
          size="sm"
          className="absolute right-2"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Edit2 className="h-4 w-4 text-muted-foreground hover:bg-gray-200" />
        </Button>
      )}
    </div>
  );
}
