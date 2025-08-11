import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { useCellContext } from './cell-context';

const NumberEditor = () => {
  const { value, handleCellChange, setIsEditing, isEditing } = useCellContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
  };

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    } else {
      setInputValue(value);
    }
  }, [isEditing]);

  return (
    <div className="h-full relative w-full">
      <div
        className={cn('h-full flex items-center gap-2', {
          'border-2 border-primary': isEditing,
          'border-transparent': !isEditing,
        })}
      >
        {isEditing && (
          <input
            ref={inputRef}
            value={inputValue}
            type={'number'}
            onChange={handleChange}
            onBlur={() => {
              handleCellChange(inputValue);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                handleCellChange(inputValue);
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
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
        )}
        {!isEditing && <div className="flex grow h-full w-full ">{value}</div>}
      </div>
    </div>
  );
};
NumberEditor.displayName = 'NumberEditor';
export { NumberEditor };
