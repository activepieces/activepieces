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

const STORE_KEY = 'event_ends_checkpoint';
const LOG_PREFIX = '[google-calendar] event_ends';
const SAMPLE_SIZE = 5;
const SAMPLE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export const eventEnds = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_ends',
  classification: 'READ',
  displayName: 'Event Ends',
  description: 'Fires when an event ends.',
  aiMetadata: {
    description: 'Fires once per event when an event in the selected calendar reaches its end time, detected by polling. Each fired item is the event that just ended. An end time missed by a late or failed check still fires at the next check (up to 7 days late), never before the event ends. All-day events end at midnight in the calendar\'s time zone. Cancelled events never fire. Can watch all events in the calendar or be scoped to a single specific event.',
  },
  propertyGroups: [
    {
      key: 'event',
      display: 'section',
      label: 'Event',
      icon: 'calendar',
      props: ['calendar_id', 'specific_event', 'event_id'],
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
      legacyResume: 'after-last-poll',
    });
  },

  async onDisable() {
    return;
  },

  async run(context) {
    const { calendar_id, specific_event, event_id } = context.propsValue;
    if (specific_event) {
      specificEvent.require({ eventId: event_id });
    }
    if (!calendar_id) {
      return [];
    }
    return rangeReminders.poll({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      watchKey: buildWatchKey({ propsValue: context.propsValue }),
      calendarId: calendar_id,
      eventId: specific_event && event_id ? event_id : undefined,
      leadMs: 0,
      anchor: 'end',
      legacyResume: 'after-last-poll',
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
    const { recent } = await rangeEvents.listUpcomingOrRecent({
      auth: context.auth,
      calendarId: calendar_id,
      nowMs: Date.now(),
      lookbackMs: SAMPLE_LOOKBACK_MS,
      limit: SAMPLE_SIZE,
      anchor: 'end',
    });
    return recent;
  },
});

function buildWatchKey({
  propsValue,
}: {
  propsValue: {
    calendar_id?: string;
    specific_event?: boolean;
    event_id?: string;
  };
}): string {
  return JSON.stringify([
    propsValue.calendar_id ?? '',
    propsValue.specific_event === true ? propsValue.event_id ?? '' : '',
  ]);
}
