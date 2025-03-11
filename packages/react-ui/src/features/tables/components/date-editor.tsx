import { t } from 'i18next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { RenderEditCellProps } from 'react-data-grid';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatUtils } from '@/lib/utils';

import { Row } from '../lib/types';

function isValidDate(date: string) {
  return !isNaN(new Date(date).getTime());
}
function DateEditor({
  row,
  column,
  onRowChange,
  onClose,
  value: initialValue,
}: RenderEditCellProps<Row, { id: string }> & {
  value: string;
}) {
  const [date, setDate] = useState<Date | undefined>(
    isValidDate(initialValue) ? new Date(initialValue) : undefined,
  );
  const [month, setMonth] = useState<Date | undefined>(
    isValidDate(initialValue) ? new Date(initialValue) : undefined,
  );
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState(
    isValidDate(initialValue)
      ? formatUtils.formatDateOnly(new Date(initialValue))
      : '',
  );

  const commitChanges = () => {
    if (date) {
      onRowChange({ ...row, [column.key]: date.toISOString() }, true);
      onClose();
    }
  };
  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const isoString = newDate.toISOString();
      onRowChange({ ...row, [column.key]: isoString }, true);
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose();
    }
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    //clear selection frrom browser
    inputRef.current?.focus();
  }, []);
  return (
    <div className="h-full" ref={containerRef}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full h-full flex items-center justify-between gap-2',
              'border-2 border-primary',
              'bg-background text-sm px-2',
              'focus:outline-none',
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <input
              ref={inputRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
              placeholder={t('mm/dd/yyy')}
              value={inputValue}
              type="text"
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
                  commitChanges();
                }
              }}
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

            <div className="flex-none bg-primary/10 p-1">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            month={month}
            onMonthChange={setMonth}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateEditor };
