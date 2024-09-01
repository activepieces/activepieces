'use client';

import { format, subDays, addDays } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type DatePickerWithRangeProps = {
  onChange: (date: DateRange) => void;
  className?: string;
  from?: string;
  to?: string;
  maxDate?: Date;
  minDate?: Date;
  presetType: 'past' | 'future';
};

export function DatePickerWithRange({
  className,
  onChange,
  from,
  to,
  maxDate = new Date(),
  minDate,
  presetType = 'past',
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

  const handlePresetChange = (value: string) => {
    const today = new Date();
    let newDate: DateRange;

    switch (value) {
      case 'week':
        newDate = { from: subDays(today, 7), to: today };
        break;
      case 'month':
        newDate = { from: subDays(today, 30), to: today };
        break;
      case '3months':
        newDate = { from: subDays(today, 90), to: today };
        break;
      case '6months':
        newDate = { from: subDays(today, 180), to: today };
        break;
      default:
        newDate = { from: today, to: addDays(today, parseInt(value)) };
    }

    setDate(newDate);
    onChange(newDate);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] h-8 border-dashed justify-start text-left font-normal',
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
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex space-x-2 mb-2">
            <Select onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {presetType === 'past' ? (
                  <>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="7">Next 7 days</SelectItem>
                    <SelectItem value="30">Next 30 days</SelectItem>
                    <SelectItem value="90">Next 90 days</SelectItem>
                    <SelectItem value="180">Next 180 days</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            min={2}
            weekStartsOn={1}
            toDate={maxDate}
            fromDate={minDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
