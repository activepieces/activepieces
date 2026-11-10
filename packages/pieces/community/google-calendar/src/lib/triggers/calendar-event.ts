import { createTrigger, isNil, Property } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarCommon, googleCalendarAuth } from '../common';
import { GoogleCalendarEvent } from '../common/types';
import { eventScan, ListedEvent } from '../common/event-scan';
import { eventOutputSchema } from '../output-schemas';

const CHECKPOINT_STORE_KEY = 'new_or_updated_checkpoint';
const TRIGGER_NAME = 'new_or_updated_event';
const SAMPLE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const SAMPLE_SIZE = 5;

export const calendarEventChanged = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_or_updated_event',
  classification: 'READ',
  displayName: 'New or Updated Event',
  description: 'Triggers when an event is added or updated',
  aiMetadata: {
    description:
      'Fires when an event in the selected calendar is created or modified, checked by polling the last-updated time. Each fired item is the affected event; every saved change fires once. Deleted or cancelled events do not fire (use Event Cancelled for those). Can optionally expand recurring events so every occurrence fires separately.',
  },
  propertyGroups: [
    {
      key: 'calendar',
      display: 'section',
      label: 'Calendar',
      icon: 'calendar',
      props: ['calendar_id', 'expandRecurringEvent'],
    },
  ],
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    expandRecurringEvent: Property.Checkbox({
      displayName: 'Expand Recurring Events',
      description: 'Fires once per occurrence of a recurring event.',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    kind: 'calendar#event',
    etag: '3350849506974000',
    id: '0nsfi5ttd2b17ac76ma2f37oi9',
    htmlLink:
      'https://www.google.com/calendar/event?eid=kgjb90uioj4klrgfmdsnjsjvlgkm',
    summary: 'ap-event-test',
    created: '2023-02-03T11:36:36.000Z',
    updated: '2023-02-03T11:45:53.487Z',
    description: 'Sample description',
    status: 'confirmed',
    creator: {
      email: 'test@test.com',
      self: true,
    },
    organizer: {
      email: 'test@test.com',
      self: true,
    },
    start: {
      dateTime: '2023-02-02T22:30:00+03:00',
      timeZone: 'Asia/Amman',
    },
    end: {
      dateTime: '2023-02-02T23:30:00+03:00',
      timeZone: 'Asia/Amman',
    },
    transparency: 'transparent',
    iCalUID: '0nsfi5ttd2b17ac76ma2f37oi9@google.com',
    sequence: 1,
    attendees: [
      {
        email: 'attende@test.com',
        responseStatus: 'needsAction',
      },
      {
        email: 'test@test.com',
        organizer: true,
        self: true,
        responseStatus: 'accepted',
      },
    ],
    reminders: {
      useDefault: true,
    },
    eventType: 'default',
  },
  outputSchema: eventOutputSchema,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await eventScan.restoreOrBaseline({
      store: context.store,
      storeKey: CHECKPOINT_STORE_KEY,
      watchKey: buildWatchKey({ propsValue: context.propsValue }),
      isRepublish: context.isRepublish,
      triggerName: TRIGGER_NAME,
    });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const { calendar_id, expandRecurringEvent } = context.propsValue;
    if (!calendar_id) {
      return [];
    }
    const listed = await eventScan.pollUpdatedEvents({
      auth: context.auth,
      store: context.store,
      storeKey: CHECKPOINT_STORE_KEY,
      watchKey: buildWatchKey({ propsValue: context.propsValue }),
      calendarId: calendar_id,
      query: buildQuery({ expandRecurringEvent }),
      triggerName: TRIGGER_NAME,
      skippedItems: 'Event changes made',
    });
    return listed.filter(isNewVersion).map(({ event }) => event);
  },
  async test(context) {
    const { calendar_id, expandRecurringEvent } = context.propsValue;
    if (!calendar_id) {
      return [];
    }
    const listed = await eventScan.sampleUpdatedEvents({
      auth: context.auth,
      calendarId: calendar_id,
      query: buildQuery({ expandRecurringEvent }),
      lookbackMs: SAMPLE_WINDOW_MS,
      triggerName: TRIGGER_NAME,
    });
    return listed
      .filter(({ event }) => event.status !== 'cancelled')
      .sort((left, right) => right.updatedMs - left.updatedMs)
      .slice(0, SAMPLE_SIZE)
      .map(({ event }): GoogleCalendarEvent => event);
  },
});

function isNewVersion({ event, updatedMs, previous }: ListedEvent): boolean {
  if (event.status === 'cancelled') {
    return false;
  }
  return isNil(previous) || updatedMs > previous.updatedMs;
}

function buildQuery({
  expandRecurringEvent,
}: {
  expandRecurringEvent: boolean | undefined;
}): Record<string, string> {
  return {
    showDeleted: 'true',
    singleEvents: expandRecurringEvent ? 'true' : 'false',
  };
}

function buildWatchKey({
  propsValue,
}: {
  propsValue: { calendar_id?: string; expandRecurringEvent?: boolean };
}): string {
  return JSON.stringify([
    propsValue.calendar_id ?? '',
    propsValue.expandRecurringEvent === true,
  ]);
}
