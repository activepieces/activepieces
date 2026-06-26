import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import {
  googleCalendarCommon,
  googleCalendarAuth,
  getAccessToken,
  GoogleCalendarAuthValue,
} from '../common';
import { getCalendars } from '../common/helper';
import dayjs from 'dayjs';

interface FreeBusyResponse {
  kind: 'calendar#freeBusy';
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: { start: string; end: string }[];
      errors?: { domain: string; reason: string }[];
    };
  };
}

interface Interval {
  start: number;
  end: number;
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) {
    return [];
  }
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

function complement(
  busy: Interval[],
  windowStart: number,
  windowEnd: number
): Interval[] {
  const free: Interval[] = [];
  let cursor = windowStart;
  for (const block of busy) {
    if (block.start > cursor) {
      free.push({ start: cursor, end: Math.min(block.start, windowEnd) });
    }
    cursor = Math.max(cursor, block.end);
    if (cursor >= windowEnd) {
      break;
    }
  }
  if (cursor < windowEnd) {
    free.push({ start: cursor, end: windowEnd });
  }
  return free.filter((interval) => interval.end > interval.start);
}

function clipToWorkingHours(
  free: Interval[],
  startHour: number,
  endHour: number
): Interval[] {
  const clipped: Interval[] = [];
  for (const interval of free) {
    let dayCursor = dayjs(interval.start).startOf('day');
    const intervalEnd = dayjs(interval.end);
    while (dayCursor.valueOf() < interval.end) {
      const workStart = dayCursor.add(startHour, 'hour');
      const workEnd = dayCursor.add(endHour, 'hour');
      const slotStart = Math.max(interval.start, workStart.valueOf());
      const slotEnd = Math.min(interval.end, workEnd.valueOf());
      if (slotEnd > slotStart) {
        clipped.push({ start: slotStart, end: slotEnd });
      }
      dayCursor = dayCursor.add(1, 'day');
      if (dayCursor.valueOf() > intervalEnd.valueOf()) {
        break;
      }
    }
  }
  return clipped;
}

export const findFreeSlots = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_find_free_slots',
  displayName: 'Find Free Time Slots',
  description:
    'Computes open time slots shared across one or more calendars within a window, by inverting their busy blocks.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the OPEN time slots common to the selected calendars within a window — the inverse of their combined busy blocks, optionally filtered to a minimum duration and to working hours. Use this instead of Find Busy/Free Periods (which returns only busy blocks and forces you to invert and reconcile them yourself) when you need the actual free intervals to answer "when can everyone meet". Idempotent because it performs no writes, but the result depends entirely on the window: pass absolute start/end times, since a window relative to "now" yields a shifting set of slots.',
    idempotent: true,
  },
  props: {
    calendar_ids: Property.MultiSelectDropdown({
      auth: googleCalendarAuth,
      displayName: 'Calendars',
      description:
        'The calendars whose schedules must all be free. A slot is returned only when it is open on every selected calendar.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const authProp = auth as GoogleCalendarAuthValue;
        const calendars = await getCalendars(authProp);
        return {
          disabled: false,
          options: calendars.map((calendar) => ({
            label: calendar.summary,
            value: calendar.id,
          })),
        };
      },
    }),
    start_date: Property.DateTime({
      displayName: 'Window Start',
      description:
        'Start of the search window, as an absolute ISO 8601 timestamp (e.g. "2026-06-01T09:00:00Z"). Prefer absolute times over relative ones.',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'Window End',
      description:
        'End of the search window, as an absolute ISO 8601 timestamp (e.g. "2026-06-05T18:00:00Z").',
      required: true,
    }),
    min_duration_minutes: Property.Number({
      displayName: 'Minimum Slot Duration (minutes)',
      description:
        'Discard any open slot shorter than this many minutes. Leave empty to return every open slot regardless of length.',
      required: false,
    }),
    working_hours_start: Property.Number({
      displayName: 'Working Hours Start (hour 0-23)',
      description:
        'If set together with Working Hours End, each day\'s open slots are clipped to this hour range, interpreted in UTC (not the calendar\'s local time zone). Example: 9 for 09:00 UTC. Leave both unset to return slots across the full window.',
      required: false,
    }),
    working_hours_end: Property.Number({
      displayName: 'Working Hours End (hour 0-23)',
      description:
        'Upper bound of the daily working-hours window. Example: 17 for 5 PM. Ignored unless Working Hours Start is also set.',
      required: false,
    }),
  },
  async run(context) {
    const {
      calendar_ids,
      start_date,
      end_date,
      min_duration_minutes,
      working_hours_start,
      working_hours_end,
    } = context.propsValue;
    const token = await getAccessToken(context.auth);

    const windowStart = dayjs(start_date).valueOf();
    const windowEnd = dayjs(end_date).valueOf();
    if (windowEnd <= windowStart) {
      throw new Error('Window End must be after Window Start.');
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${googleCalendarCommon.baseUrl}/freeBusy`,
      body: {
        timeMin: dayjs(start_date).toISOString(),
        timeMax: dayjs(end_date).toISOString(),
        items: calendar_ids.map((id) => ({ id })),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest<FreeBusyResponse>(request);

    const allBusy: Interval[] = [];
    const calendarErrors: {
      calendarId: string;
      errors: { domain: string; reason: string }[];
    }[] = [];
    let calendarsWithData = 0;
    for (const calendarId of Object.keys(response.body.calendars)) {
      const calendarResult = response.body.calendars[calendarId];
      if (calendarResult.errors?.length) {
        calendarErrors.push({ calendarId, errors: calendarResult.errors });
        continue;
      }
      calendarsWithData++;
      const blocks = calendarResult.busy ?? [];
      for (const block of blocks) {
        allBusy.push({
          start: dayjs(block.start).valueOf(),
          end: dayjs(block.end).valueOf(),
        });
      }
    }

    if (calendarErrors.length > 0 && calendarsWithData === 0) {
      throw new Error(
        `Could not read availability for any requested calendar: ${calendarErrors
          .map(
            (entry) =>
              `${entry.calendarId} (${entry.errors
                .map((error) => error.reason)
                .join(', ')})`
          )
          .join('; ')}. Verify the calendar IDs with List Calendars.`
      );
    }

    const mergedBusy = mergeIntervals(allBusy);
    let freeIntervals = complement(mergedBusy, windowStart, windowEnd);

    if (
      working_hours_start !== undefined &&
      working_hours_end !== undefined &&
      working_hours_end > working_hours_start
    ) {
      freeIntervals = clipToWorkingHours(
        freeIntervals,
        working_hours_start,
        working_hours_end
      );
    }

    if (min_duration_minutes !== undefined && min_duration_minutes > 0) {
      const minMs = min_duration_minutes * 60 * 1000;
      freeIntervals = freeIntervals.filter(
        (interval) => interval.end - interval.start >= minMs
      );
    }

    const freeSlots = freeIntervals.map((interval) => ({
      start: dayjs(interval.start).toISOString(),
      end: dayjs(interval.end).toISOString(),
      duration_minutes: Math.round((interval.end - interval.start) / 60000),
    }));

    return {
      free_slots: freeSlots,
      count: freeSlots.length,
      ...(calendarErrors.length > 0
        ? {
            incomplete_calendars: calendarErrors,
            warning:
              'Some requested calendars could not be read (see incomplete_calendars); the returned slots do not account for busy time on those calendars.',
          }
        : {}),
    };
  },
});
