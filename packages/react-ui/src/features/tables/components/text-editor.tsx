import { useEffect, useRef, useState } from 'react';
import type { RenderEditCellProps } from 'react-data-grid';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { Row } from '../lib/types';

const TextEditor = ({
  row,
  column,
  onRowChange,
  onClose,
  value: initialValue,
}: RenderEditCellProps<Row, { id: string }> & {
  value: string;
}) => {
  const [value, setValue] = useState(initialValue);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    <div className="h-full relative w-full relative">
      <div
        className={cn(
          'h-min-[300px] w-min-[calc(100%+50px)] w-full absolute top-0  z-50',
          'border-2 border-primary  drop-shadow-md',
          'bg-background',
        )}
      >
        <Textarea
          ref={textAreaRef}
          value={value ?? ''}
          onChange={handleChange}
          onBlur={commitChanges}
          onKeyDown={(e) => {
            e.stopPropagation();
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
              commitChanges();
              e.preventDefault();
            }
            if (e.key === 'Escape') {
              onClose();
              e.preventDefault();
            }
          }}
          minRows={4}
          maxRows={6}
          className={cn(
            'flex-1 h-full min-w-0 rounded-none',
            'border-none text-sm px-2 resize-none ',
            'focus:outline-none',
            'placeholder:text-muted-foreground',
          )}
          autoComplete="off"
        />
      </div>
    </div>
  );
};
TextEditor.displayName = 'TextEditor';
export { TextEditor };
