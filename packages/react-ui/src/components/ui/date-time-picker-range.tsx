import { format, subDays, addDays, startOfDay, endOfDay } from 'date-fns';
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

export type PresetKey =
  | '7days'
  | '14days'
  | '30days'
  | '90days'
  | '7'
  | '14'
  | '30'
  | '90';

type DateTimePickerWithRangeProps = {
  onChange: (date: DateRange | undefined) => void;
  className?: string;
  from?: string;
  to?: string;
  maxDate?: Date;
  minDate?: Date;
  presetType: 'past' | 'future';
  defaultSelectedRange?: PresetKey;
};

const applyTimeToDate = (timeDate: Date, targetDate: Date): Date => {
  const d = new Date(targetDate);
  d.setHours(
    timeDate.getHours(),
    timeDate.getMinutes(),
    timeDate.getSeconds(),
    timeDate.getMilliseconds(),
  );
  return d;
};

const getDayBoundaries = () => {
  const now = new Date();
  return {
    from: startOfDay(now),
    to: endOfDay(now),
  };
};

const PRESETS: Record<PresetKey, () => { from: Date; to: Date }> = {
  '7days': () => ({ from: subDays(new Date(), 7), to: new Date() }),
  '14days': () => ({ from: subDays(new Date(), 14), to: new Date() }),
  '30days': () => ({ from: subDays(new Date(), 30), to: new Date() }),
  '90days': () => ({ from: subDays(new Date(), 90), to: new Date() }),
  '7': () => ({ from: new Date(), to: addDays(new Date(), 7) }),
  '14': () => ({ from: new Date(), to: addDays(new Date(), 14) }),
  '30': () => ({ from: new Date(), to: addDays(new Date(), 30) }),
  '90': () => ({ from: new Date(), to: addDays(new Date(), 90) }),
};

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

const detectPreset = (
  from?: Date,
  to?: Date,
  presetType?: 'past' | 'future',
): string | null => {
  if (!from || !to) return null;

  const candidates =
    presetType === 'past'
      ? (['7days', '14days', '30days', '90days'] as PresetKey[])
      : (['7', '14', '30', '90'] as PresetKey[]);

  for (const key of candidates) {
    const { from: pf, to: pt } = PRESETS[key]();
    if (
      startOfDay(pf).getTime() === startOfDay(from).getTime() &&
      endOfDay(pt).getTime() === endOfDay(to).getTime()
    ) {
      return key;
    }
  }

  return null;
};

const getDefaultRange = (presetKey: PresetKey) => {
  const preset = PRESETS[presetKey]();
  preset.from!.setHours(0, 0, 0, 0);
  preset.to!.setHours(23, 59, 59, 999);
  return preset;
};

const getInitialDateAndPreset = (
  fromProp?: string,
  toProp?: string,
  presetType: 'past' | 'future' = 'past',
  defaultPresetKey?: PresetKey,
): { initialDate: DateRange | undefined; initialPreset: string | null } => {
  let initialDate: DateRange | undefined;
  let initialPreset: string | null = null;

  if (fromProp && toProp) {
    initialDate = {
      from: new Date(fromProp),
      to: new Date(toProp),
    };
    initialPreset = detectPreset(initialDate.from, initialDate.to, presetType);
  } else if (defaultPresetKey) {
    initialDate = getDefaultRange(defaultPresetKey);
    initialPreset = defaultPresetKey;
  }

  return { initialDate, initialPreset };
};

export function DateTimePickerWithRange({
  className,
  onChange,
  from,
  to,
  maxDate = new Date(),
  minDate,
  presetType = 'past',
  defaultSelectedRange,
}: DateTimePickerWithRangeProps) {
  const { initialDate, initialPreset } = React.useMemo(() => {
    return getInitialDateAndPreset(from, to, presetType, defaultSelectedRange);
  }, [from, to, presetType, defaultSelectedRange]);

  const [date, setDate] = React.useState<DateRange | undefined>(initialDate);
  const [timeDate, setTimeDate] = React.useState<DateRange>({
    from: initialDate?.from,
    to: initialDate?.to,
  });
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(
    initialPreset,
  );

  const isDefaultApplied = React.useRef(!!initialPreset && !from && !to);

  React.useEffect(() => {
    if (isDefaultApplied.current && date) {
      onChange(date);
      isDefaultApplied.current = false;
    }
  }, [date, onChange]);

  React.useEffect(() => {
    if (from && to) {
      const newDate: DateRange = { from: new Date(from), to: new Date(to) };
      setDate(newDate);
      setTimeDate({ from: newDate.from, to: newDate.to });
      const preset = detectPreset(newDate.from, newDate.to, presetType);
      setSelectedPreset(preset);
    } else if (!from && !to) {
      setDate(initialDate);
      setTimeDate({ from: initialDate?.from, to: initialDate?.to });
      setSelectedPreset(initialPreset);
    }
  }, [from, to, presetType, initialDate, initialPreset]);

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setSelectedPreset(null);
    if (!selectedDate) {
      setDate(undefined);
      onChange(undefined);
      return;
    }

    const newDate = {
      from: selectedDate.from
        ? applyTimeToDate(
            timeDate.from || getDayBoundaries().from,
            selectedDate.from,
          )
        : undefined,
      to: selectedDate.to
        ? applyTimeToDate(timeDate.to || getDayBoundaries().to, selectedDate.to)
        : undefined,
    };
    setDate(newDate);
    onChange(newDate);
  };

  const handlePresetChange = (value: string) => {
    const newRange = PRESETS[value as PresetKey]();
    newRange.from!.setHours(0, 0, 0, 0);
    newRange.to!.setHours(23, 59, 59, 999);

    setDate(newRange);
    setTimeDate({ from: newRange.from, to: newRange.to });
    setSelectedPreset(value);
    onChange(newRange);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'min-w-[90px] border-dashed justify-start text-left font-normal',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedPreset ? (
              <span>{getPresetLabel(selectedPreset)}</span>
            ) : date?.from ? (
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
            <Select
              onValueChange={handlePresetChange}
              value={selectedPreset || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Select preset')} />
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
            weekStartsOn={1}
            toDate={maxDate}
            fromDate={minDate}
          />

          <Separator className="mb-4" />

          <div className="flex gap-1.5 px-2 items-center text-sm mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {t('Select Time Range')}
          </div>

          <div className="flex gap-3 items-center px-2 mb-2">
            <TimePicker
              date={timeDate.from}
              name="from"
              setDate={(fromTime) => {
                const fromWithTime = applyTimeToDate(
                  fromTime,
                  date?.from ?? new Date(),
                );
                const updated = { from: fromWithTime, to: date?.to };
                setDate(updated);
                setTimeDate({ ...timeDate, from: fromTime });
                setSelectedPreset(null);
                onChange(updated);
              }}
            />
            {t('to')}
            <TimePicker
              date={timeDate.to}
              name="to"
              setDate={(toTime) => {
                const toWithTime = applyTimeToDate(
                  toTime,
                  date?.to ?? date?.from ?? new Date(),
                );
                const updated = { from: date?.from, to: toWithTime };
                setDate(updated);
                setTimeDate({ ...timeDate, to: toTime });
                setSelectedPreset(null);
                onChange(updated);
              }}
            />
          </div>

          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary! w-full"
              onClick={() => {
                setDate(undefined);
                setTimeDate({ from: undefined, to: undefined });
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
