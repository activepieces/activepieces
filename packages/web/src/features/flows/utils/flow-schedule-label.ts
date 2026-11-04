import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  PopulatedFlow,
  ScheduleOptions,
  TriggerSourceScheduleType,
} from '@activepieces/shared';
import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';

function describe({
  flow,
  locale,
  viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: DescribeParams): FlowScheduleLabel | null {
  const triggerSource = flow.triggerSource;
  if (isNil(triggerSource)) {
    return null;
  }
  if (triggerSource.pieceName === MANUAL_TRIGGER_PIECE_NAME) {
    return {
      title: t('Manual'),
      detail: t('via Run Flow'),
      tooltip: t('Runs only when someone clicks Run Flow.'),
    };
  }
  const schedule = triggerSource.schedule;
  if (isNil(schedule)) {
    return {
      title: t('On event'),
      detail: t('instantly'),
      tooltip: t('Runs instantly, each time an event comes in.'),
    };
  }
  const timing = describeTiming({
    schedule,
    zone: { locale, viewerTimeZone, now },
  });
  if (triggerSource.pieceName === SCHEDULE_PIECE_NAME) {
    return {
      title: t('On schedule'),
      detail: timing.detail,
      tooltip: timing.scheduleTooltip,
    };
  }
  return {
    title: t('On changes'),
    detail: timing.detail,
    tooltip: timing.pollingTooltip,
  };
}

function describeTiming({
  schedule,
  zone,
}: {
  schedule: ScheduleOptions;
  zone: ViewerContext;
}): Timing {
  if (schedule.type === TriggerSourceScheduleType.INTERVAL) {
    return everyMinutesTiming({
      minutes: Math.max(1, Math.round(schedule.intervalMs / 60_000)),
    });
  }
  const preset = parseCron({ expression: schedule.cronExpression });
  if (preset.kind === 'everyMinutes') {
    return everyMinutesTiming({ minutes: preset.minutes });
  }
  if (!isKnownTimeZone({ timeZone: schedule.timezone })) {
    return customTiming({
      cronExpression: schedule.cronExpression,
      zoneNote: schedule.timezone,
    });
  }
  const scheduleZone = { ...zone, scheduleTimeZone: schedule.timezone };
  if (preset.kind === 'custom') {
    return customTiming({
      cronExpression: schedule.cronExpression,
      zoneNote: zoneName({ zone: scheduleZone }),
    });
  }
  const fixed = describeFixedTime({ preset, zone: scheduleZone });
  return {
    ...fixed,
    pollingTooltip: t(
      'Checks for changes {when}. Runs once for each item found.',
      { when: fixed.detail },
    ),
  };
}

function everyMinutesTiming({ minutes }: { minutes: number }): Timing {
  return {
    detail: t('every {minutes, plural, =1 {minute} other {# min}}', {
      minutes,
    }),
    scheduleTooltip: t(
      'Runs every {minutes, plural, =1 {minute} other {# minutes}}, whether or not anything changed.',
      { minutes },
    ),
    pollingTooltip: t(
      'Checks for changes every {minutes, plural, =1 {minute} other {# minutes}}. Runs once for each item found.',
      { minutes },
    ),
  };
}

function customTiming({
  cronExpression,
  zoneNote,
}: {
  cronExpression: string;
  zoneNote: string;
}): Timing {
  const { data: sentence } = tryCatchSync(() =>
    cronstrue.toString(cronExpression, { locale: 'en' }),
  );
  return {
    detail: t('custom times'),
    scheduleTooltip: isNil(sentence)
      ? t('Runs on a custom schedule ({zone}).', { zone: zoneNote })
      : t('Runs {schedule} ({zone}).', {
          schedule: sentence.charAt(0).toLocaleLowerCase() + sentence.slice(1),
          zone: zoneNote,
        }),
    pollingTooltip: t(
      'Checks for changes on a custom schedule. Runs once for each item found.',
    ),
  };
}

function describeFixedTime({
  preset,
  zone,
}: {
  preset: FixedPreset;
  zone: ScheduleContext;
}): { detail: string; scheduleTooltip: string } {
  switch (preset.kind) {
    case 'hourly':
      return preset.weekdaysOnly
        ? {
            detail: t('hourly, Mon–Fri'),
            scheduleTooltip: t(
              'Runs every hour on the hour ({zone}), Monday to Friday.',
              { zone: zoneName({ zone }) },
            ),
          }
        : {
            detail: t('hourly'),
            scheduleTooltip: t('Runs every hour on the hour ({zone}).', {
              zone: zoneName({ zone }),
            }),
          };
    case 'daily': {
      const nextRun = nextDailyRun({
        hour: preset.hour,
        minute: preset.minute,
        timeZone: zone.scheduleTimeZone,
        now: zone.now,
      });
      const atRun = { ...zone, at: nextRun };
      const time = scheduleTime({ zone: atRun });
      const differs = differsFromViewer({ zone: atRun });
      if (preset.weekdaysOnly) {
        return {
          detail: t('Mon–Fri at {time}', { time }),
          scheduleTooltip: differs
            ? t('Runs Monday to Friday at {time}.', { time })
            : t('Runs Monday to Friday at {time} ({zone}).', {
                time,
                zone: zoneName({ zone }),
              }),
        };
      }
      return {
        detail: t('daily at {time}', { time }),
        scheduleTooltip: differs
          ? t('Runs every day at {time} ({yourTime} your time).', {
              time,
              yourTime: formatInstant({
                locale: zone.locale,
                at: nextRun,
                timeZone: zone.viewerTimeZone,
              }),
            })
          : t('Runs every day at {time} ({zone}).', {
              time,
              zone: zoneName({ zone }),
            }),
      };
    }
    case 'weekly': {
      const atNow = { ...zone, at: zone.now };
      const time = scheduleTime({
        zone: atNow,
        hour: preset.hour,
        minute: preset.minute,
      });
      const weekday = formatWeekday({
        locale: zone.locale,
        weekday: preset.weekday,
        width: 'long',
      });
      return {
        detail: t('{weekday} at {time}', {
          weekday: formatWeekday({
            locale: zone.locale,
            weekday: preset.weekday,
            width: 'short',
          }),
          time,
        }),
        scheduleTooltip: differsFromViewer({ zone: atNow })
          ? t('Runs every {weekday} at {time}.', { weekday, time })
          : t('Runs every {weekday} at {time} ({zone}).', {
              weekday,
              time,
              zone: zoneName({ zone }),
            }),
      };
    }
    case 'monthly': {
      const atNow = { ...zone, at: zone.now };
      const time = scheduleTime({
        zone: atNow,
        hour: preset.hour,
        minute: preset.minute,
      });
      const day = formatDayOfMonth({ locale: zone.locale, day: preset.day });
      const differs = differsFromViewer({ zone: atNow });
      const zoneLabel = zoneName({ zone });
      if (preset.day > 28) {
        return {
          detail: t('{day} at {time}', { day, time }),
          scheduleTooltip: differs
            ? t('Runs on the {day} at {time}. Skips months with fewer days.', {
                day,
                time,
              })
            : t(
                'Runs on the {day} at {time} ({zone}). Skips months with fewer days.',
                { day, time, zone: zoneLabel },
              ),
        };
      }
      return {
        detail: t('{day} at {time}', { day, time }),
        scheduleTooltip: differs
          ? t('Runs on the {day} of every month at {time}.', { day, time })
          : t('Runs on the {day} of every month at {time} ({zone}).', {
              day,
              time,
              zone: zoneLabel,
            }),
      };
    }
  }
}

function parseCron({ expression }: { expression: string }): Preset {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    return CUSTOM_PRESET;
  }
  const [minuteField, hourField, dayField, monthField, weekdayField] = fields;
  if (monthField !== '*') {
    return CUSTOM_PRESET;
  }
  const everyDay = weekdayField === '*';
  const weekdaysOnly = weekdayField === '1-5';
  if (hourField === '*' && dayField === '*' && everyDay) {
    if (minuteField === '*') {
      return { kind: 'everyMinutes', minutes: 1 };
    }
    const step = /^(?:\*|0)\/(\d+)$/.exec(minuteField);
    const minutes = step
      ? toNumber({ field: step[1], min: 1, max: 59 })
      : undefined;
    if (!isNil(minutes) && 60 % minutes === 0) {
      return { kind: 'everyMinutes', minutes };
    }
  }
  const minute = toNumber({ field: minuteField, min: 0, max: 59 });
  if (isNil(minute)) {
    return CUSTOM_PRESET;
  }
  if (hourField === '*' && dayField === '*' && minute === 0) {
    return everyDay || weekdaysOnly
      ? { kind: 'hourly', weekdaysOnly }
      : CUSTOM_PRESET;
  }
  const hour = toNumber({ field: hourField, min: 0, max: 23 });
  if (isNil(hour)) {
    return CUSTOM_PRESET;
  }
  if (dayField === '*') {
    if (everyDay || weekdaysOnly) {
      return { kind: 'daily', hour, minute, weekdaysOnly };
    }
    const weekday = toNumber({ field: weekdayField, min: 0, max: 7 });
    return isNil(weekday)
      ? CUSTOM_PRESET
      : { kind: 'weekly', hour, minute, weekday: weekday % 7 };
  }
  const day = toNumber({ field: dayField, min: 1, max: 31 });
  return !isNil(day) && everyDay
    ? { kind: 'monthly', hour, minute, day }
    : CUSTOM_PRESET;
}

function toNumber({
  field,
  min,
  max,
}: {
  field: string;
  min: number;
  max: number;
}): number | undefined {
  if (!/^\d+$/.test(field)) {
    return undefined;
  }
  const value = Number(field);
  return value >= min && value <= max ? value : undefined;
}

function nextDailyRun({
  hour,
  minute,
  timeZone,
  now,
}: {
  hour: number;
  minute: number;
  timeZone: string;
  now: Date;
}): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const offsetNow = offsetMinutes({ timeZone, at: now });
  const todayRun =
    Date.UTC(part('year'), part('month') - 1, part('day'), hour, minute) -
    offsetNow * 60_000;
  const candidate =
    todayRun <= now.getTime() ? todayRun + 24 * 60 * 60_000 : todayRun;
  const offsetAtRun = offsetMinutes({ timeZone, at: new Date(candidate) });
  return new Date(candidate - (offsetAtRun - offsetNow) * 60_000);
}

function scheduleTime({
  zone,
  hour,
  minute,
}: {
  zone: ScheduleContext & { at: Date };
  hour?: number;
  minute?: number;
}): string {
  const time = isNil(hour)
    ? formatInstant({
        locale: zone.locale,
        at: zone.at,
        timeZone: zone.scheduleTimeZone,
      })
    : formatClock({ locale: zone.locale, hour, minute: minute ?? 0 });
  return differsFromViewer({ zone })
    ? `${time} ${zoneAbbreviation({ zone })}`
    : time;
}

function formatInstant({
  locale,
  at,
  timeZone,
}: {
  locale: string;
  at: Date;
  timeZone: string;
}): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(at);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return formatClock({ locale, hour: value('hour'), minute: value('minute') });
}

function formatClock({
  locale,
  hour,
  minute,
}: {
  locale: string;
  hour: number;
  minute: number;
}): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    ...(minute === 0 ? {} : { minute: '2-digit' }),
    timeZone: 'UTC',
  }).format(Date.UTC(2000, 0, 1, hour % 24, minute));
}

function formatWeekday({
  locale,
  weekday,
  width,
}: {
  locale: string;
  weekday: number;
  width: 'short' | 'long';
}): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: width,
    timeZone: 'UTC',
  }).format(Date.UTC(2000, 0, 2 + weekday));
}

function formatDayOfMonth({
  locale,
  day,
}: {
  locale: string;
  day: number;
}): string {
  if (!locale.toLowerCase().startsWith('en')) {
    return String(day);
  }
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(day);
  return `${day}${ENGLISH_ORDINAL_SUFFIXES[rule] ?? 'th'}`;
}

function differsFromViewer({
  zone,
}: {
  zone: ScheduleContext & { at: Date };
}): boolean {
  return (
    offsetMinutes({ timeZone: zone.scheduleTimeZone, at: zone.at }) !==
    offsetMinutes({ timeZone: zone.viewerTimeZone, at: zone.at })
  );
}

function zoneAbbreviation({
  zone,
}: {
  zone: ScheduleContext & { at: Date };
}): string {
  return (
    new Intl.DateTimeFormat(zone.locale, {
      timeZone: zone.scheduleTimeZone,
      timeZoneName: 'short',
    })
      .formatToParts(zone.at)
      .find((part) => part.type === 'timeZoneName')?.value ??
    zone.scheduleTimeZone
  );
}

function zoneName({ zone }: { zone: ScheduleContext }): string {
  if (zone.scheduleTimeZone === 'UTC') {
    return 'UTC';
  }
  const city = zone.scheduleTimeZone.split('/').pop();
  if (!zone.scheduleTimeZone.includes('/') || isNil(city)) {
    return zoneAbbreviation({ zone: { ...zone, at: zone.now } });
  }
  return t('{city} time', { city: city.replace(/_/g, ' ') });
}

function offsetMinutes({
  timeZone,
  at,
}: {
  timeZone: string;
  at: Date;
}): number {
  const { data: name } = tryCatchSync(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'longOffset',
      })
        .formatToParts(at)
        .find((part) => part.type === 'timeZoneName')?.value,
  );
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name ?? '');
  if (isNil(match)) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function isKnownTimeZone({ timeZone }: { timeZone: string }): boolean {
  const { error } = tryCatchSync(
    () => new Intl.DateTimeFormat('en-US', { timeZone }),
  );
  return isNil(error);
}

export const flowScheduleLabelUtils = {
  describe,
};

const SCHEDULE_PIECE_NAME = '@activepieces/piece-schedule';
const MANUAL_TRIGGER_PIECE_NAME = '@activepieces/piece-manual-trigger';
const CUSTOM_PRESET: Preset = { kind: 'custom' };
const ENGLISH_ORDINAL_SUFFIXES: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
};

type FlowScheduleLabel = {
  title: string;
  detail: string;
  tooltip: string;
};

type DescribeParams = {
  flow: PopulatedFlow;
  locale: string;
  viewerTimeZone?: string;
  now?: Date;
};

type ViewerContext = {
  locale: string;
  viewerTimeZone: string;
  now: Date;
};

type ScheduleContext = ViewerContext & {
  scheduleTimeZone: string;
};

type Timing = {
  detail: string;
  scheduleTooltip: string;
  pollingTooltip: string;
};

type FixedPreset =
  | { kind: 'hourly'; weekdaysOnly: boolean }
  | { kind: 'daily'; hour: number; minute: number; weekdaysOnly: boolean }
  | { kind: 'weekly'; hour: number; minute: number; weekday: number }
  | { kind: 'monthly'; hour: number; minute: number; day: number };

type Preset =
  | FixedPreset
  | { kind: 'everyMinutes'; minutes: number }
  | { kind: 'custom' };
