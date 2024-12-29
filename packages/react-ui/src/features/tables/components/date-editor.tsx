import { t } from 'i18next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RenderEditCellProps } from 'react-data-grid';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatUtils } from '@/lib/utils';

type Row = {
  id: string;
  [key: string]: any;
};

function DateEditor({
  row,
  column,
  onRowChange,
  onClose,
}: RenderEditCellProps<Row, { id: string }>) {
  const [date, setDate] = useState<Date | undefined>(
    row[column.key] ? new Date(row[column.key]) : undefined,
  );
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Auto-focus the calendar when the editor opens
    setIsOpen(true);
  }, []);

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

  return (
    <div className="h-full">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full h-full flex items-center justify-between gap-2',
              'border-2 border-primary',
              'bg-background text-sm px-2',
              'focus:outline-none',
            )}
          >
            <span className="flex-1 text-left truncate">
              {date ? formatUtils.formatDateOnly(date) : t('Pick a date')}
            </span>
            <div className="flex-none bg-primary/10 p-1">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateEditor };
