import {
  FlowTriggerType,
  PopulatedFlow,
  ScheduleOptions,
  TriggerSourceScheduleType,
} from '@activepieces/shared';
import cronstrue from 'cronstrue/i18n';
import { t } from 'i18next';

const SCHEDULE_PIECE_NAME = '@activepieces/piece-schedule';
const MANUAL_TRIGGER_PIECE_NAME = '@activepieces/piece-manual-trigger';

export type FlowScheduleLabel = {
  title: string;
  detail?: string;
  tooltip: string;
  isError?: boolean;
};

type Preset =
  | { kind: 'everyMinutes'; minutes: number }
  | { kind: 'hourly'; weekdaysOnly: boolean }
  | { kind: 'daily'; hour: number; minute: number; weekdaysOnly: boolean }
  | { kind: 'weekly'; hour: number; minute: number; weekday: number }
  | { kind: 'monthly'; hour: number; minute: number; day: number }
  | { kind: 'custom' };

const CUSTOM: Preset = { kind: 'custom' };

const toNumber = (field: string, min: number, max: number) => {
  if (!/^\d+$/.test(field)) {
    return undefined;
  }
  const value = Number(field);
  return value >= min && value <= max ? value : undefined;
};

// Reads the cron, not the trigger's name: "0 8 * * *" from a Cron Expression trigger is still "daily at 8".
const parseCron = (expression: string): Preset => {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) {
    return CUSTOM;
  }
  const [minuteField, hourField, dayField, monthField, weekdayField] = fields;
  if (monthField !== '*') {
    return CUSTOM;
  }
  const everyDay = weekdayField === '*';
  const weekdaysOnly = weekdayField === '1-5';

  if (hourField === '*' && dayField === '*' && everyDay) {
    if (minuteField === '*') {
      return { kind: 'everyMinutes', minutes: 1 };
    }
    const step = /^\*\/(\d+)$/.exec(minuteField);
    const minutes = step ? toNumber(step[1], 1, 59) : undefined;
    if (minutes !== undefined) {
      return { kind: 'everyMinutes', minutes };
    }
  }

  const minute = toNumber(minuteField, 0, 59);
  if (minute === undefined) {
    return CUSTOM;
  }
  if (hourField === '*' && dayField === '*' && minute === 0) {
    return everyDay || weekdaysOnly ? { kind: 'hourly', weekdaysOnly } : CUSTOM;
  }
  const hour = toNumber(hourField, 0, 23);
  if (hour === undefined) {
    return CUSTOM;
  }
  if (dayField === '*') {
    if (everyDay || weekdaysOnly) {
      return { kind: 'daily', hour, minute, weekdaysOnly };
    }
    const weekday = toNumber(weekdayField, 0, 7);
    return weekday === undefined
      ? CUSTOM
      : { kind: 'weekly', hour, minute, weekday: weekday % 7 };
  }
  const day = toNumber(dayField, 1, 31);
  return day !== undefined && everyDay
    ? { kind: 'monthly', hour, minute, day }
    : CUSTOM;
};

const offsetMinutes = (timeZone: string, at: Date) => {
  let name: string | undefined;
  try {
    name = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value;
  } catch {
    // Browsers without 'longOffset' (Safari < 15.4): treat the zones as equal rather than crash the row.
    return 0;
  }
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name ?? '');
  if (!match) {
    return 0;
  }
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
};

const isKnownTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
};

type ZoneContext = {
  locale: string;
  scheduleTimeZone: string;
  viewerTimeZone: string;
  now: Date;
};

const formatClock = (locale: string, totalMinutes: number) => {
  const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440;
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(
    Date.UTC(2000, 0, 1, Math.floor(minutesInDay / 60), minutesInDay % 60),
  );
};

const zoneAbbreviation = ({ locale, scheduleTimeZone, now }: ZoneContext) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: scheduleTimeZone,
    timeZoneName: 'short',
  })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value ?? scheduleTimeZone;

// "Cairo time" for Africa/Cairo, "UTC" for UTC.
const zoneName = (zone: ZoneContext) => {
  if (zone.scheduleTimeZone === 'UTC') {
    return 'UTC';
  }
  const city = zone.scheduleTimeZone.split('/').pop();
  if (!zone.scheduleTimeZone.includes('/') || !city) {
    return zoneAbbreviation(zone);
  }
  return t('{city} time', { city: city.replace(/_/g, ' ') });
};

const differsFromViewer = (zone: ZoneContext) =>
  offsetMinutes(zone.scheduleTimeZone, zone.now) !==
  offsetMinutes(zone.viewerTimeZone, zone.now);

const formatWeekday = (
  locale: string,
  weekday: number,
  width: 'short' | 'long',
) =>
  new Intl.DateTimeFormat(locale, { weekday: width, timeZone: 'UTC' }).format(
    // 2000-01-02 was a Sunday, so day 0 + weekday lands on the right name.
    Date.UTC(2000, 0, 2 + weekday),
  );

// ICU selectordinal would print "2th" in languages without English ordinal rules while a key is untranslated,
// so only English gets a suffix and other languages get the plain number.
const formatDayOfMonth = (locale: string, day: number) => {
  if (!locale.toLowerCase().startsWith('en')) {
    return String(day);
  }
  const suffixes: Record<string, string> = { one: 'st', two: 'nd', few: 'rd' };
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(day);
  return `${day}${suffixes[rule] ?? 'th'}`;
};

const describeSchedule = (
  preset: Exclude<Preset, { kind: 'everyMinutes' }>,
  zone: ZoneContext,
  cronExpression: string,
): { title: string; detail: string; tooltip: string } => {
  const differs = differsFromViewer(zone);
  const clock = (hour: number, minute: number) => {
    const time = formatClock(zone.locale, hour * 60 + minute);
    return differs ? `${time} ${zoneAbbreviation(zone)}` : time;
  };
  const yourTime = (hour: number, minute: number) =>
    formatClock(
      zone.locale,
      hour * 60 +
        minute -
        offsetMinutes(zone.scheduleTimeZone, zone.now) +
        offsetMinutes(zone.viewerTimeZone, zone.now),
    );
  const zoneNote = differs ? undefined : zoneName(zone);

  switch (preset.kind) {
    case 'hourly':
      return preset.weekdaysOnly
        ? {
            title: t('Hourly'),
            detail: t('on weekdays'),
            tooltip: t(
              'Runs at the start of every hour, Monday to Friday ({zone}).',
              { zone: zoneName(zone) },
            ),
          }
        : {
            title: t('Hourly'),
            detail: t('always'),
            tooltip: t('Runs at the start of every hour.'),
          };
    case 'daily': {
      const time = clock(preset.hour, preset.minute);
      const note = differs
        ? t('{time} your time', {
            time: yourTime(preset.hour, preset.minute),
          })
        : zoneNote;
      // In another zone the weekdays can shift (Mon–Fri UTC is Tue–Sat in Tokyo), so no "your time" there.
      return preset.weekdaysOnly
        ? {
            title: t('Weekdays'),
            detail: t('at {time}', { time }),
            tooltip: zoneNote
              ? t('Runs Monday to Friday at {time} ({note}).', {
                  time,
                  note: zoneNote,
                })
              : t('Runs Monday to Friday at {time}.', { time }),
          }
        : {
            title: t('Daily'),
            detail: t('at {time}', { time }),
            tooltip: t('Runs every day at {time} ({note}).', { time, note }),
          };
    }
    case 'weekly': {
      const time = clock(preset.hour, preset.minute);
      const weekday = formatWeekday(zone.locale, preset.weekday, 'long');
      return {
        title: t('Weekly'),
        detail: t('{weekday} at {time}', {
          weekday: formatWeekday(zone.locale, preset.weekday, 'short'),
          time,
        }),
        tooltip: zoneNote
          ? t('Runs every {weekday} at {time} ({note}).', {
              weekday,
              time,
              note: zoneNote,
            })
          : t('Runs every {weekday} at {time}.', { weekday, time }),
      };
    }
    case 'monthly': {
      const time = clock(preset.hour, preset.minute);
      const values = {
        day: formatDayOfMonth(zone.locale, preset.day),
        time,
        note: zoneNote,
      };
      // Days 29–31 don't exist every month, so say "on the 31st" and warn instead of "of every month".
      const tooltip =
        preset.day > 28
          ? zoneNote
            ? t(
                'Runs on the {day} at {time} ({note}). Skips months without a {day}.',
                values,
              )
            : t(
                'Runs on the {day} at {time}. Skips months without a {day}.',
                values,
              )
          : zoneNote
          ? t('Runs on the {day} of every month at {time} ({note}).', values)
          : t('Runs on the {day} of every month at {time}.', values);
      return {
        title: t('Monthly'),
        detail: t('{day} at {time}', values),
        tooltip,
      };
    }
    case 'custom': {
      const sentence = cronstrue.toString(cronExpression, { locale: 'en' });
      return {
        title: t('Scheduled'),
        detail: t('custom times'),
        tooltip: t('Runs {schedule} ({note}).', {
          // Lowercase only the first letter: "At 09:00 AM, Monday…" → "at 09:00 AM, Monday…".
          schedule: sentence.charAt(0).toLocaleLowerCase() + sentence.slice(1),
          note: zoneName(zone),
        }),
      };
    }
  }
};

const everyMinutesLabel = (
  minutes: number,
  isPolling: boolean,
): FlowScheduleLabel => ({
  title: t('Every {minutes, plural, =1 {minute} other {# min}}', { minutes }),
  detail: isPolling ? t('if new data') : t('always'),
  tooltip: isPolling
    ? t(
        'Checks for new data every {minutes, plural, =1 {minute} other {# minutes}}. Runs only when there’s something new.',
        { minutes },
      )
    : t(
        'Runs every {minutes, plural, =1 {minute} other {# minutes}}, whether or not anything changed.',
        { minutes },
      ),
});

const describeTrigger = (
  schedule: ScheduleOptions | null | undefined,
  isPolling: boolean,
  zone: Omit<ZoneContext, 'scheduleTimeZone'>,
): FlowScheduleLabel => {
  if (!schedule) {
    return {
      title: t('Instant'),
      detail: t('on new data'),
      tooltip: t('Runs as soon as new data arrives.'),
    };
  }
  if (schedule.type === TriggerSourceScheduleType.INTERVAL) {
    return everyMinutesLabel(
      Math.max(1, Math.round(schedule.intervalMs / 60_000)),
      isPolling,
    );
  }
  const preset = parseCron(schedule.cronExpression);
  if (preset.kind === 'everyMinutes') {
    return everyMinutesLabel(preset.minutes, isPolling);
  }
  const scheduleTimeZone = isKnownTimeZone(schedule.timezone)
    ? schedule.timezone
    : 'UTC';
  const described = describeSchedule(
    preset,
    { ...zone, scheduleTimeZone },
    schedule.cronExpression,
  );
  if (!isPolling) {
    return described;
  }
  return {
    title: described.title,
    detail: t('if new data'),
    tooltip: t(
      'Checks for new data on a schedule. Runs only when there’s something new.',
    ),
  };
};

export const flowScheduleLabel = (
  flow: PopulatedFlow,
  options: { locale: string; viewerTimeZone?: string; now?: Date },
): FlowScheduleLabel | null => {
  const zone = {
    locale: options.locale,
    viewerTimeZone:
      options.viewerTimeZone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    now: options.now ?? new Date(),
  };
  const triggerSource = flow.triggerSource;
  // The trigger source belongs to the live (published) flow; flow.version can be a newer draft,
  // so it wins whenever it exists.
  if (triggerSource?.pieceName === MANUAL_TRIGGER_PIECE_NAME) {
    // Manual flows only run from the Run Flow button, never on new data.
    return {
      title: t('Manual'),
      detail: t('run by hand'),
      tooltip: t('Runs only when someone starts it.'),
    };
  }
  if (triggerSource) {
    const isPolling =
      triggerSource.pieceName !== SCHEDULE_PIECE_NAME &&
      Boolean(triggerSource.schedule);
    return describeTrigger(triggerSource.schedule, isPolling, zone);
  }
  switch (flow.version.trigger?.type) {
    case FlowTriggerType.EMPTY:
      return {
        title: t('No trigger'),
        tooltip: t('Add a trigger so this flow can run.'),
        isError: true,
      };
    case FlowTriggerType.PIECE:
      return describeTrigger(undefined, false, zone);
    default:
      return null;
  }
};
