import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { useCellContext } from './cell-context';
import { CellEditorTrigger } from './cell-editor-trigger';

function isValidDate(date: string) {
  return !isNaN(new Date(date).getTime());
}
function getFormattedDate(date: string) {
  return isValidDate(date) ? formatUtils.formatDateOnly(new Date(date)) : '';
}
function DateEditor() {
  const { value, handleCellChange, setIsEditing, isEditing } = useCellContext();
  const [date, setDate] = useState<Date | undefined>(
    isValidDate(value) ? new Date(value) : undefined,
  );
  const [month, setMonth] = useState<Date | undefined>(
    isValidDate(value) ? new Date(value) : undefined,
  );
  const [inputValue, setInputValue] = useState(getFormattedDate(value));
  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (isNil(newDate)) {
      setInputValue('');
      return;
    }
    setInputValue(formatUtils.formatDateOnly(newDate));
    handleCellChange(newDate.toISOString());
  };

  const handleClose = () => {
    const isCleared = inputValue.trim() === '';
    if (
      inputValue === getFormattedDate(value) ||
      (!isCleared && !isValidDate(inputValue))
    ) {
      setIsEditing(false);
      return;
    }
    handleCellChange(isCleared ? '' : new Date(inputValue).toISOString());
  };

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setInputValue(getFormattedDate(value));
    setDate(isValidDate(value) ? new Date(value) : undefined);
    setMonth(isValidDate(value) ? new Date(value) : undefined);
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isEditing]);
  return (
    <div className="h-full w-full">
      <Popover
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <CellEditorTrigger isEditing={isEditing}>
          {isEditing && (
            <input
              ref={inputRef}
              placeholder={t('mm/dd/yyy')}
              value={inputValue}
              type="text"
              onClick={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                setInputValue(e.target.value);
                const typedDate = isValidDate(e.target.value)
                  ? new Date(e.target.value)
                  : undefined;
                setDate(typedDate);
                if (typedDate) {
                  setMonth(typedDate);
                }
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleClose();
                  e.preventDefault();
                }
              }}
              className={cn(
                'flex-1 h-full min-w-0',
                'border-none text-sm px-2',
                'focus:outline-hidden',
                'placeholder:text-muted-foreground',
                {
                  'border-transparent bg-transparent!': !isEditing,
                },
              )}
              autoComplete="off"
            />
          )}
          {!isEditing && (
            <div className="flex grow h-full min-w-0">
              {getFormattedDate(value)}
            </div>
          )}
        </CellEditorTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            setIsEditing(false);
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateEditor };
