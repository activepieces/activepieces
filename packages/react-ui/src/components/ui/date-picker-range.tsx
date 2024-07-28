'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerWithRangeProps = {
  onChange: (date: DateRange) => void;
  className?: string;
  from?: string;
  to?: string;
};

export function DatePickerWithRange({
  className,
  onChange,
  from,
  to,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>();

  React.useEffect(() => {
    setDate({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }, [from, to]);

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] h-8 border-dashed justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            min={2}
            weekStartsOn={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
