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

type DateTimePickerWithRangeProps = {
  onChange: (date: DateRange | undefined) => void;
  className?: string;
  from?: string;
  to?: string;
  maxDate?: Date;
  minDate?: Date;
  presetType: 'past' | 'future';
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
export function DateTimePickerWithRange({
  className,
  onChange,
  from,
  to,
  maxDate = new Date(),
  minDate,
  presetType = 'past',
}: DateTimePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  const [timeDate, setTimeDate] = React.useState<DateRange>({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(
    null,
  );

  const getPresetLabel = (value: string) => {
    const labels: Record<string, string> = {
      '7days': t('Last 7 Days'),
      '14days': t('Last 14 Days'),
      '30days': t('Last 30 Days'),
      '90days': t('Last 90 Days'),
      '7': t('Next 7 days'),
      '14': t('Next 14 days'),
      '30': t('Next 30 days'),
      '90': t('Next 90 days'),
    };
    return labels[value] || '';
  };

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setSelectedPreset(null);

    if (selectedDate) {
      const newDate = {
        from:
          selectedDate.from && timeDate.from
            ? applyTimeToDate({
                timeDate: timeDate.from,
                targetDate: selectedDate.from,
              })
            : selectedDate.from
            ? applyTimeToDate({
                timeDate: getStartToEndDayTime().from,
                targetDate: selectedDate.from,
              })
            : undefined,
        to:
          selectedDate.to && timeDate.to
            ? applyTimeToDate({
                timeDate: timeDate.to,
                targetDate: selectedDate.to,
              })
            : selectedDate.to
            ? applyTimeToDate({
                timeDate: getStartToEndDayTime().to,
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
      case '7days':
        newDate = { from: subDays(today, 7), to: today };
        break;
      case '14days':
        newDate = { from: subDays(today, 14), to: today };
        break;
      case '30days':
        newDate = { from: subDays(today, 30), to: today };
        break;
      case '90days':
        newDate = { from: subDays(today, 90), to: today };
        break;
      default:
        newDate = { from: today, to: addDays(today, parseInt(value)) };
    }
    newDate.from!.setHours(0, 0, 0, 0);
    newDate.to!.setHours(23, 59, 59, 999);
    setDate(newDate);
    setSelectedPreset(value);
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
              'min-w-[90px] border-dashed justify-start text-left font-normal',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              selectedPreset ? (
                <span>{getPresetLabel(selectedPreset)}</span>
              ) : date.to ? (
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
            <Select
              onValueChange={handlePresetChange}
              value={selectedPreset || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {presetType === 'past' ? (
                  <>
                    <SelectItem value="7days">{t('Last 7 Days')}</SelectItem>
                    <SelectItem value="14days">{t('Last 14 Days')}</SelectItem>
                    <SelectItem value="30days">{t('Last 30 Days')}</SelectItem>
                    <SelectItem value="90days">{t('Last 90 Days')}</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="7">{t('Next 7 days')}</SelectItem>
                    <SelectItem value="14">{t('Next 14 days')}</SelectItem>
                    <SelectItem value="30">{t('Next 30 days')}</SelectItem>
                    <SelectItem value="90">{t('Next 90 days')}</SelectItem>
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
          <div className="flex gap-1.5 px-2 items-center text-sm mb-3">
            <Clock className="w-4 h-4 text-muted-foreground"></Clock>
            {t('Select Time Range')}
          </div>

          <div className="flex gap-3  items-center px-2 mb-2">
            <div className="flex gap-2 grow justify-center items-center items-center">
              <TimePicker
                date={timeDate.from}
                name="from"
                setDate={(fromTime) => {
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
                  setSelectedPreset(null);
                }}
              ></TimePicker>
            </div>

            {t('to')}

            <div className="flex gap-2 grow justify-center items-center ">
              <TimePicker
                date={timeDate.to}
                name="to"
                setDate={(toTime) => {
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
                  setSelectedPreset(null);
                }}
              ></TimePicker>
            </div>
          </div>

          <div className="flex justify-center mt-3">
            <Button
              variant={'ghost'}
              size={'sm'}
              className="text-primary hover:!text-primary w-full"
              onClick={() => {
                setDate(undefined);
                setTimeDate({
                  from: undefined,
                  to: undefined,
                });
                setSelectedPreset(null);
                onChange(undefined);
              }}
            >
              {t('Clear')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
