import {
  createTrigger,
  isNil,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { specificEvent } from '../common/specific-event';
import { googleCalendarCommon, googleCalendarAuth } from '../common';
import { rangeEvents } from '../common/range-events';
import { rangeReminders } from '../common/range-reminders';
import { eventOutputSchema } from '../output-schemas';

const STORE_KEY = 'event_start_checkpoint';
const LOG_PREFIX = '[google-calendar] event_starts_in';
const SAMPLE_SIZE = 5;
const SAMPLE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export const eventStartTimeBefore = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_starts_in',
  classification: 'READ',
  displayName: 'Event Start (Time Before)',
  description:
    'Fires at a specified amount of time before an event starts (e.g., a reminder).',
  aiMetadata: {
    description: 'Fires once per event a configurable lead time (in minutes, hours, or days) before it begins in the selected calendar, acting as a pre-event reminder; a lead time of 0 fires when the event starts. Each fired item is the upcoming event. A reminder whose check was late or failed still fires at the next check if the event has not started yet (up to 7 days late), never before it is due; with a lead time above 0, an event that has already started gets no reminder; an event booked after its reminder time fires at the next check if it has not started yet; a rescheduled event fires again for its new start time. All-day events start at midnight in the calendar\'s time zone. Cancelled events never fire. Can watch all events or a single specific event.',
  },
  propertyGroups: [
    {
      key: 'event',
      display: 'section',
      label: 'Event',
      icon: 'calendar',
      props: ['calendar_id', 'specific_event', 'event_id'],
    },
    {
      key: 'timing',
      display: 'section',
      label: 'Timing',
      icon: 'calendar',
      props: ['time_value', 'time_unit'],
    },
  ],
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    specific_event: Property.Checkbox({
      displayName: 'Target Specific Event',
      description: 'Watch one event instead of the whole calendar.',
      required: false,
      defaultValue: false,
    }),
    event_id: googleCalendarCommon.eventDropdown(false),
    time_value: Property.Number({
      displayName: 'Time Before',
      description: 'How long before the event starts to fire. Use 0 to fire when it starts.',
      required: true,
      defaultValue: 15,
    }),
    time_unit: Property.StaticDropdown({
      displayName: 'Time Unit',
      description: 'Unit for Time Before.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Minutes', value: 'minutes', description: 'Short notice', icon: 'calendar' },
          { label: 'Hours', value: 'hours', description: 'Longer notice', icon: 'calendar' },
          { label: 'Days', value: 'days', description: 'Longest notice', icon: 'calendar' },
        ],
      },
      defaultValue: 'minutes',
    }),
  },
  outputSchema: eventOutputSchema,
  type: TriggerStrategy.POLLING,
  sampleData: {
    kind: 'calendar#event',
    etag: '"3419997894982000"',
    id: 'sample_event_id_67890',
    status: 'confirmed',
    htmlLink:
      'https://www.google.com/calendar/event?eid=c2FtcGxlX2V2ZW50X2lkXzY3ODkw',
    created: '2025-08-14T09:00:00.000Z',
    updated: '2025-08-14T09:00:00.000Z',
    summary: 'Project Deadline',
    creator: { email: 'manager@example.com' },
    organizer: {
      email: 'manager@example.com',
      self: true,
    },
    start: {
      dateTime: '2025-08-14T14:30:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: '2025-08-14T15:30:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    iCalUID: 'sample_event_id_67890@google.com',
    sequence: 0,
    reminders: { useDefault: true },
    eventType: 'default',
  },

  async onEnable(context) {
    if (context.propsValue.specific_event) {
      specificEvent.require({ eventId: context.propsValue.event_id });
    }
    await rangeReminders.enable({
      store: context.store,
      storeKey: STORE_KEY,
      watchKey: buildWatchKey({ propsValue: context.propsValue }),
      isRepublish: context.isRepublish === true,
      legacyResume: 'from-upgrade-time',
    });
  },

  async onDisable() {
    return;
  },

  async run(context) {
    const { calendar_id, specific_event, event_id, time_value, time_unit } =
      context.propsValue;
    if (specific_event) {
      specificEvent.require({ eventId: event_id });
    }
    if (!calendar_id || isNil(time_value)) {
      return [];
    }
    return rangeReminders.poll({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      watchKey: buildWatchKey({ propsValue: context.propsValue }),
      calendarId: calendar_id,
      eventId: specific_event && event_id ? event_id : undefined,
      leadMs: leadTimeMs({ value: time_value, unit: time_unit }),
      anchor: 'start',
      legacyResume: 'from-upgrade-time',
      logPrefix: LOG_PREFIX,
    });
  },

  async test(context) {
    const { calendar_id, specific_event, event_id } = context.propsValue;
    if (!calendar_id) {
      return [];
    }
    if (specific_event && event_id) {
      const event = await rangeEvents.getEventOrNull({
        auth: context.auth,
        calendarId: calendar_id,
        eventId: event_id,
      });
      return isNil(event) || event.status === 'cancelled' ? [] : [event];
    }
    const { upcoming, recent } = await rangeEvents.listUpcomingOrRecent({
      auth: context.auth,
      calendarId: calendar_id,
      nowMs: Date.now(),
      lookbackMs: SAMPLE_LOOKBACK_MS,
      limit: SAMPLE_SIZE,
      anchor: 'start',
    });
    return upcoming.length > 0 ? upcoming : recent;
  },
});

function leadTimeMs({
  value,
  unit,
}: {
  value: number;
  unit: string | undefined;
}): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `Time Before must be a number of 0 or more; got ${value}.`
    );
  }
  if (unit === 'hours') {
    return value * 60 * 60 * 1000;
  }
  if (unit === 'days') {
    return value * 24 * 60 * 60 * 1000;
  }
  return value * 60 * 1000;
}

function buildWatchKey({
  propsValue,
}: {
  propsValue: {
    calendar_id?: string;
    specific_event?: boolean;
    event_id?: string;
    time_value?: number;
    time_unit?: string;
  };
}): string {
  return JSON.stringify([
    propsValue.calendar_id ?? '',
    propsValue.specific_event === true ? propsValue.event_id ?? '' : '',
    propsValue.time_value ?? null,
    propsValue.time_unit ?? 'minutes',
  ]);
}
