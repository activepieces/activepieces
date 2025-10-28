import { useEffect, useRef, useState } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useCellContext } from './cell-context';

const TextEditor = () => {
  const { value, handleCellChange, setIsEditing, isEditing } = useCellContext();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState(value);
  useEffect(() => {
    if (isEditing) {
      textAreaRef.current?.focus();
      setInputValue(value);
    } else {
      setInputValue(value);
    }
  }, [isEditing]);
  return (
    <div className="h-full relative w-full relative">
      <div
        className={cn({
          'h-min-[300px] w-min-[calc(100%+50px)] w-full absolute top-0  z-50 border-2 border-primary  drop-shadow-md':
            isEditing,
        })}
      >
        {isEditing && (
          <Textarea
            ref={textAreaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onBlur={() => {
              handleCellChange(inputValue);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              e.stopPropagation();
              if (e.key === 'Enter' && !e.shiftKey) {
                handleCellChange(inputValue);
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
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
        )}
        {!isEditing && (
          <div className="flex grow h-full w-full ">
            {value?.replaceAll('\n', ' ')}
          </div>
        )}
      </div>
    </div>
  );
};
TextEditor.displayName = 'TextEditor';
export { TextEditor };
