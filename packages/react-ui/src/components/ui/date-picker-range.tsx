'use client';

import { format, subDays, addDays } from 'date-fns';
import { t } from 'i18next';
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

import { ClockPicker } from './clock-picker';
import { Label } from './label';
import { Separator } from './separator';

type DatePickerWithRangeProps = {
  onChange: (date: DateRange | undefined) => void;
  className?: string;
  from?: string;
  to?: string;
  maxDate?: Date;
  minDate?: Date;
  presetType: 'past' | 'future';
};

const applyTimeToDate = ({
  sourceDate,
  targetDate,
}: {
  sourceDate: Date;
  targetDate: Date;
}): Date => {
  // Extract time components from sourceDate
  const hours = sourceDate.getHours();
  const minutes = sourceDate.getMinutes();
  const seconds = sourceDate.getSeconds();
  const milliseconds = sourceDate.getMilliseconds();

  // Apply the time components to targetDate
  targetDate.setHours(hours, minutes, seconds, milliseconds);

  return targetDate; // Return the updated targetDate
};
const getInitialTimeDate = () => {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  return {
    from: startDate,
    to: endDate,
  };
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
  const [timeDate, setTimeDate] = React.useState<DateRange>(
    getInitialTimeDate(),
  );
  React.useEffect(() => {
    setDate({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    const initialTimeDate = getInitialTimeDate();
    setTimeDate({
      from: from ? new Date(from) : initialTimeDate.from,
      to: to ? new Date(to) : initialTimeDate.to,
    });
  }, [from, to]);

  const handleSelect = (selectedDate: DateRange | undefined) => {
    if (selectedDate) {
      const newDate = {
        from:
          selectedDate.from && timeDate.from
            ? applyTimeToDate({
                sourceDate: timeDate.from,
                targetDate: selectedDate.from,
              })
            : undefined,
        to:
          selectedDate.to && timeDate.to
            ? applyTimeToDate({
                sourceDate: timeDate.to,
                targetDate: selectedDate.to,
              })
            : undefined,
      };
      setDate(newDate);
      onChange(newDate);
    } else {
      setDate(selectedDate);
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
    newDate.from!.setHours(0, 0, 0, 0);
    newDate.to!.setHours(23, 59, 59, 999);
    setDate(newDate);
    setTimeDate(newDate);
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
                  {format(date.from, 'LLL dd, y')}-{' '}
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
          <Separator className="my-2"></Separator>
          <div className="flex gap-2 justify-center items-center flex-col mb-2">
            <div className="flex gap-2 justify-center items-center mt-2">
              <Label className="mr-1">{t('Starting Time')}</Label>
              <ClockPicker
                date={timeDate.from}
                setDate={(fromTime) => {
                  if (date?.from) {
                    const fromWithCorrectedTime = applyTimeToDate({
                      sourceDate: fromTime,
                      targetDate: date.from,
                    });
                    setDate({
                      from: fromWithCorrectedTime,
                      to: date.to,
                    });
                    onChange({
                      from: fromWithCorrectedTime,
                      to: date.to,
                    });
                  }
                  setTimeDate({ ...timeDate, from: fromTime });
                }}
              ></ClockPicker>
            </div>
            <div className="flex gap-2 justify-center items-center mt-2">
              <Label>{t('Finshing Time')}</Label>
              <ClockPicker
                date={timeDate.to}
                setDate={(toTime) => {
                  const toDate = date?.to ?? date?.from;
                  if (toDate) {
                    const toWithCorrectedTime = applyTimeToDate({
                      sourceDate: toTime,
                      targetDate: toDate,
                    });
                    setDate({
                      from: date?.from,
                      to: toWithCorrectedTime,
                    });
                    onChange({
                      from: date?.from,
                      to: toWithCorrectedTime,
                    });
                  }
                  setTimeDate({ ...timeDate, to: toTime });
                }}
              ></ClockPicker>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
