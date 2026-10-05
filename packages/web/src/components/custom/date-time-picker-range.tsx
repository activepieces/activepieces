import { format, subDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { t } from 'i18next';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { TimePicker } from '@/components/custom/time-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type PresetKey =
  | 'today'
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
  today: () => ({ from: startOfDay(new Date()), to: new Date() }),
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
    today: t('Today'),
    '7days': t('Last 7 days'),
    '14days': t('Last 14 days'),
    '30days': t('Last 30 days'),
    '90days': t('Last 90 days'),
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

  const candidates: PresetKey[] =
    presetType === 'past'
      ? ['today', '7days', '14days', '30days', '90days']
      : ['7', '14', '30', '90'];

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

export const getDefaultRange = (presetKey: PresetKey) => {
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

  const presetKeys: PresetKey[] =
    presetType === 'past'
      ? ['today', '7days', '14days', '30days', '90days']
      : ['7', '14', '30', '90'];
  const isMobile = useIsMobile();
  const [showTimes, setShowTimes] = React.useState(
    hasCustomTime({ range: initialDate }),
  );
  const clear = () => {
    setDate(undefined);
    setTimeDate({ from: undefined, to: undefined });
    setSelectedPreset(null);
    onChange(undefined);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start border-dashed">
            <CalendarIcon />
            {selectedPreset ? (
              <span>{getPresetLabel(selectedPreset)}</span>
            ) : date?.from ? (
              <span className="tabular-nums">
                {rangeLabel({ range: date, withTime: showTimes })}
              </span>
            ) : (
              <span>{t('Pick a date range')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-(--radix-popover-content-available-width) p-0"
          align="end"
          collisionPadding={16}
        >
          <div className="flex flex-col sm:flex-row">
            <ul className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 sm:w-40 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0">
              {presetKeys.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => handlePresetChange(key)}
                    className={cn(
                      'flex h-8 w-full items-center rounded-lg px-2.5 text-left text-sm whitespace-nowrap outline-hidden hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-accent-8',
                      selectedPreset === key
                        ? 'bg-gray-3 font-medium text-gray-12'
                        : 'text-gray-11',
                    )}
                  >
                    {getPresetLabel(key)}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex min-w-0 flex-col">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleSelect}
                numberOfMonths={isMobile ? 1 : 2}
                weekStartsOn={1}
                toDate={maxDate}
                fromDate={minDate}
                className="self-center p-3"
              />
              {showTimes && (
                <div className="flex flex-wrap items-center gap-3 border-t px-3 py-3 text-sm">
                  <Clock className="size-4 text-gray-11" />
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
                  <span className="text-gray-11">{t('to')}</span>
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
              )}
              <div className="flex items-center gap-2 border-t px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-gray-11 tabular-nums">
                  {date?.from
                    ? rangeLabel({ range: date, withTime: showTimes })
                    : t('No range selected')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimes((shown) => !shown)}
                >
                  <Clock />
                  {showTimes ? t('Hide times') : t('Add times')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!date?.from}
                  onClick={clear}
                >
                  {t('Clear')}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function hasCustomTime({ range }: { range: DateRange | undefined }): boolean {
  if (!range?.from || !range.to) {
    return false;
  }
  return (
    range.from.getTime() !== startOfDay(range.from).getTime() ||
    range.to.getTime() !== endOfDay(range.to).getTime()
  );
}

function rangeLabel({
  range,
  withTime,
}: {
  range: DateRange;
  withTime: boolean;
}): string {
  const pattern = withTime ? 'MMM d, h:mm a' : 'MMM d, y';
  if (!range.from) {
    return '';
  }
  if (!range.to) {
    return format(range.from, pattern);
  }
  return `${format(range.from, pattern)} – ${format(range.to, pattern)}`;
}
