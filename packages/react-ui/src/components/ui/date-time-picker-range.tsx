import { format, subDays, addDays } from 'date-fns';
import { t } from 'i18next';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
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

import { Separator } from './separator';
import { TimePicker } from './time-picker';
import { isNil } from '@activepieces/shared';

type DateTimePickerWithRangeProps = {
  onChange: (date: DateRange | undefined) => void;
  className?: string;
  from?: string;
  to?: string;
  maxDate?: Date;
  minDate?: Date;
  presetType: 'past' | 'future';
  type?: 'dateSelect' | 'presets';
};

const applyTimeToDate = ({
  timeDate,
  targetDate,
}: {
  timeDate: Date;
  targetDate: Date;
}): Date => {
  const hours = timeDate.getHours();
  const minutes = timeDate.getMinutes();
  const seconds = timeDate.getSeconds();
  const milliseconds = timeDate.getMilliseconds();
  return new Date(
    new Date(new Date(targetDate)).setHours(
      hours,
      minutes,
      seconds,
      milliseconds,
    ),
  );
};

const getStartToEndDayTime = () => {
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

const getDaysDifference = (date1: Date, date2: Date): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  const utcDate1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utcDate2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor(Math.abs(utcDate2 - utcDate1) / oneDay);
};

export function DateTimePickerWithRange({
  className,
  onChange,
  from,
  to,
  maxDate = new Date(),
  minDate,
  presetType = 'past',
  type = 'presets',
}: DateTimePickerWithRangeProps) {
  const initialFrom = from ? new Date(from) : undefined;
  const initialTo = to ? new Date(to) : undefined;

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: initialFrom,
    to: initialTo,
  });
  const [timeDate, setTimeDate] = React.useState<DateRange>({
    from: initialFrom,
    to: initialTo,
  });

  const updateDateAndTime = (selectedDate: DateRange | undefined) => {
    if (selectedDate) {
      const defaultTime = getStartToEndDayTime();
      const newDate = {
        from:
          selectedDate.from
            ? applyTimeToDate({
                timeDate: timeDate.from ?? defaultTime.from,
                targetDate: selectedDate.from,
              })
            : undefined,
        to:
          selectedDate.to
            ? applyTimeToDate({
                timeDate: timeDate.to ?? defaultTime.to,
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

  const handleSelect = (selectedDate: DateRange | undefined) => {
    updateDateAndTime(selectedDate);
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
    
    if (newDate.from) newDate.from.setHours(0, 0, 0, 0);
    if (newDate.to) newDate.to.setHours(23, 59, 59, 999);
    
    setDate(newDate);
    onChange(newDate);
  };

  const handlePresetButtonClick = (days: number) => {
    const today = new Date();
    const newDate: DateRange = {
      from: subDays(today, days),
      to: today,
    };
    newDate.from!.setHours(0, 0, 0, 0);
    newDate.to!.setHours(23, 59, 59, 999);
    setDate(newDate);
    onChange(newDate);
  };

  const getPresetLabel = () => {
    if (isNil(date?.from) || isNil(date?.to)) return t('Select preset');
    
    const daysDiff = getDaysDifference(date.from, date.to);

    switch (daysDiff) {
      case 7:
        return t('Last 7 Days');
      case 14:
        return t('Last 14 Days');
      case 21:
        return t('Last 21 Days');
      case 30:
        return t('Last 30 Days');
      default:
        return t('Select preset');
    }
  };

  const handleClearTime = () => {
    const fromTime = getStartToEndDayTime().from;
    const toTime = getStartToEndDayTime().to;
    
    const fromDate = date?.from
        ? applyTimeToDate({
              timeDate: fromTime,
              targetDate: date.from,
          })
        : undefined;

    const toDate = date?.to
        ? applyTimeToDate({
              timeDate: toTime,
              targetDate: date.to,
          })
        : undefined;

    setTimeDate({
      from: fromTime,
      to: toTime,
    });

    setDate({
      from: fromDate,
      to: toDate,
    });
    onChange({
      from: fromDate,
      to: toDate,
    });
  }

  const handleFromTimeChange = (fromTime: Date) => {
    const fromDate = date?.from ?? new Date();
    const fromWithCorrectedTime = applyTimeToDate({
      timeDate: fromTime,
      targetDate: fromDate,
    });
    setDate({
      from: fromWithCorrectedTime,
      to: date?.to,
    });
    onChange({
      from: fromWithCorrectedTime,
      to: date?.to,
    });
    setTimeDate({ ...timeDate, from: fromTime });
  }

  const handleToTimeChange = (toTime: Date) => {
    const toDate = date?.to ?? date?.from ?? new Date();
    const toWithCorrectedTime = applyTimeToDate({
      timeDate: toTime,
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
    setTimeDate({ ...timeDate, to: toTime });
  }

  if (type === 'presets') {
    return (
      <div className={cn('inline-flex items-center gap-0 border rounded-lg border-dashed overflow-hidden', className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
            >
              <CalendarIcon className="h-4 w-4" />
              {t('Date Range')}
              <div className="bg-muted rounded-md mr-1 text-sm px-4 py-1">
                {getPresetLabel()}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-fit p-2" align="end">
            <div className="flex flex-col gap-1">
              <Button
                variant={date?.from && getDaysDifference(date.from, new Date()) === 7 && date.to?.toDateString() === new Date().toDateString() ? 'accent' : 'ghost'}
                onClick={() => handlePresetButtonClick(7)}
                className="w-full justify-start"
              >
                {t('Last 7 Days')}
              </Button>
              <Button
                variant={date?.from && getDaysDifference(date.from, new Date()) === 14 && date.to?.toDateString() === new Date().toDateString() ? 'accent' : 'ghost'}
                onClick={() => handlePresetButtonClick(14)}
                className="w-full justify-start"
              >
                {t('Last 14 Days')}
              </Button>
              <Button
                variant={date?.from && getDaysDifference(date.from, new Date()) === 21 && date.to?.toDateString() === new Date().toDateString() ? 'accent' : 'ghost'}
                onClick={() => handlePresetButtonClick(21)}
                className="w-full justify-start"
              >
                {t('Last 21 Days')}
              </Button>
              <Button
                variant={date?.from && getDaysDifference(date.from, new Date()) === 30 && date.to?.toDateString() === new Date().toDateString() ? 'accent' : 'ghost'}
                onClick={() => handlePresetButtonClick(30)}
                className="w-full justify-start"
              >
                {t('Last 30 Days')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'min-w-[90px] border-dashed justify-start text-left font-normal',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <div className="flex gap-2 items-center">
                  <div>{format(date.from, 'LLL dd, y, hh:mm a')}</div>
                  <div>{t('to')}</div>
                  <div>{format(date.to, 'LLL dd, y, hh:mm a')}</div>
                </div>
              ) : (
                format(date.from, 'LLL dd, y, hh:mm a')
              )
            ) : (
              <span>{t('Pick a date range')}</span>
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
                    <SelectItem value="week">{t('Last Week')}</SelectItem>
                    <SelectItem value="month">{t('Last Month')}</SelectItem>
                    <SelectItem value="3months">
                      {t('Last 3 Months')}
                    </SelectItem>
                    <SelectItem value="6months">
                      {t('Last 6 Months')}
                    </SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="7">{t('Next 7 days')}</SelectItem>
                    <SelectItem value="30">{t('Next 30 days')}</SelectItem>
                    <SelectItem value="90">{t('Next 90 days')}</SelectItem>
                    <SelectItem value="180">{t('Next 180 days')}</SelectItem>
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
          <Separator className="mb-4"></Separator>
          <div className="flex justify-between items-center ">
            <div className="flex gap-1.5 px-2 items-center text-sm">
              <Clock className="w-4 h-4 text-muted-foreground"></Clock>
              {t('Select Time Range')}
            </div>
            <Button
              variant={'ghost'}
              size={'sm'}
              className="text-primary hover:!text-primary"
              onClick={handleClearTime}
            >
              {t('Clear')}
            </Button>
          </div>

          <div className="flex gap-3 items-center mt-3 px-2 mb-2">
            <div className="flex gap-2 grow justify-center items-center">
              <TimePicker
                date={timeDate.from}
                name="from"
                setDate={handleFromTimeChange}
              ></TimePicker>
            </div>

            {t('to')}

            <div className="flex gap-2 grow justify-center items-center ">
              <TimePicker
                date={timeDate.to}
                name="to"
                setDate={handleToTimeChange}
              ></TimePicker>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
