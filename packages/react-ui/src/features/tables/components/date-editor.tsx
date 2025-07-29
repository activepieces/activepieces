import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatUtils } from '@/lib/utils';

import { useCellContext } from './cell-context';

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
    if (newDate) {
      setInputValue(formatUtils.formatDateOnly(newDate));
      handleCellChange(newDate.toISOString());
      setIsEditing(false);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setInputValue(getFormattedDate(value));
    }
  }, [isEditing]);
  return (
    <div className="h-full w-full" ref={containerRef}>
      <Popover
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full h-full flex items-center justify-between gap-2',
              'bg-background text-sm px-2',
              'focus:outline-none',
              {
                'border-2 border-primary': isEditing,
                'border-transparent !bg-transparent': !isEditing,
              },
            )}
          >
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
                  if (isValidDate(e.target.value)) {
                    setDate(new Date(e.target.value));
                    setMonth(new Date(e.target.value));
                  } else {
                    setDate(undefined);
                  }
                }}
                onBlur={(e) => {
                  if (!containerRef.current?.contains(e.target as Node)) {
                    handleCellChange(date?.toISOString() ?? '');
                  }
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    handleCellChange(date?.toISOString() ?? '');
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
                  {
                    'border-transparent !bg-transparent': !isEditing,
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
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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
