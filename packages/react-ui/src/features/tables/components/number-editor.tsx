import { Edit2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { RenderEditCellProps } from 'react-data-grid';

import { cn } from '@/lib/utils';

import { Row } from '../lib/types';

const NumberEditor = ({
  row,
  column,
  onRowChange,
  onClose,
  value: initialValue,
}: RenderEditCellProps<Row, { id: string }> & {
  value: string;
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
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
    <div className="h-full relative w-full">
      <div
        className={cn(
          'h-full flex items-center gap-2',
          'border-2 border-primary',
          'bg-background',
        )}
      >
        <input
          ref={inputRef}
          value={value ?? ''}
          type={'number'}
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
            'flex-1 h-full min-w-0',
            'border-none text-sm px-2',
            'focus:outline-none',
            'placeholder:text-muted-foreground',
          )}
          autoComplete="off"
        />
        <div className="flex-none bg-primary/10 p-1 mr-2">
          <Edit2 className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
};
NumberEditor.displayName = 'NumberEditor';
export { NumberEditor };
