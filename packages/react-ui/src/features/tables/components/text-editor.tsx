import { Edit2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { RenderEditCellProps } from 'react-data-grid';

import { cn } from '@/lib/utils';

type Row = {
  id: string;
  [key: string]: any;
};

function TextEditor({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<Row, { id: string }>) {
  const [value, setValue] = useState(row[column.key]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
    onRowChange({ ...row, [column.key]: newValue }, false);
  };

  const commitChanges = () => {
    if (value !== row[column.key]) {
      onRowChange({ ...row, [column.key]: value }, true);
    }
    onClose();
  };

  return (
    <div className="relative w-full h-full">
      <input
        ref={inputRef}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={commitChanges}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            commitChanges();
            e.preventDefault();
          }
          if (e.key === 'Escape') {
            onClose();
            e.preventDefault();
          }
        }}
        className={cn(
          'w-full h-full',
          'border-2 border-primary',
          'bg-background text-sm',
          'focus:outline-none',
          'placeholder:text-muted-foreground',
        )}
        autoComplete="off"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/10 p-1">
        <Edit2 className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}

export { TextEditor };
