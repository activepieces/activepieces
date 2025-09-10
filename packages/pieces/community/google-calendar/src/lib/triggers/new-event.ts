import {
  createTrigger,
  TriggerStrategy,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../../';
import { googleCalendarCommon } from '../common';
import { stopWatchEvent, watchEvent, getLatestEvent } from '../common/helper';
import { GoogleWatchResponse, GoogleCalendarEvent } from '../common/types';

export const newEvent = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new event is created in a calendar.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types to Monitor',
      description:
        'Filter by specific event types (leave empty to monitor all event types)',
      required: false,
      options: {
        options: [
          { label: 'Default Events', value: 'default' },
          { label: 'Birthday Events', value: 'birthday' },
          { label: 'Focus Time', value: 'focusTime' },
          { label: 'Out of Office', value: 'outOfOffice' },
          { label: 'Working Location', value: 'workingLocation' },
          { label: 'From Gmail', value: 'fromGmail' },
        ],
      },
    }),
    search_filter: Property.ShortText({
      displayName: 'Search Filter',
      description:
        'Only trigger for events containing this text in title, description, or location (optional)',
      required: false,
    }),
    exclude_all_day: Property.Checkbox({
      displayName: 'Exclude All-Day Events',
      description: 'Skip triggering for all-day events',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    kind: 'calendar#event',
    etag: '"3419997894982000"',
    id: 'sample_event_id_12345',
    status: 'confirmed',
    htmlLink:
      'https://www.google.com/calendar/event?eid=c2FtcGxlX2V2ZW50X2lkXzEyMzQ1',
    created: '2025-08-15T11:02:27.000Z',
    updated: '2025-08-15T11:02:27.491Z',
    summary: 'Team Sync',
    creator: { email: 'creator@example.com' },
    organizer: {
      email: 'creator@example.com',
      self: true,
    },
    start: {
      dateTime: '2025-08-18T10:00:00-07:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2025-08-18T11:00:00-07:00',
      timeZone: 'America/Los_Angeles',
    },
    iCalUID: 'sample_event_id_12345@google.com',
    sequence: 0,
    reminders: { useDefault: true },
    eventType: 'default',
  },

  async onEnable(context) {
    const calendarId = context.propsValue.calendar_id!;
    const auth = context.auth as OAuth2PropertyValue;

    const response = await watchEvent(calendarId, context.webhookUrl, auth);

    await context.store.put<GoogleWatchResponse>(
      'google_calendar_watch',
      response
    );
  },

  async onDisable(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const watch = await context.store.get<GoogleWatchResponse>(
      'google_calendar_watch'
    );

    if (watch) {
      await stopWatchEvent(watch, auth);
    }
  },

  async run(context) {
    const payload = context.payload;
    const headers = payload.headers as Record<string, string>;
    const { event_types, search_filter, exclude_all_day } = context.propsValue;

    if (headers['x-goog-resource-state'] === 'add') {
      const eventData = payload.body as GoogleCalendarEvent;

      if (event_types && event_types.length > 0) {
        const eventType = eventData.eventType || 'default';
        if (!event_types.includes(eventType)) {
          return [];
        }
      }

      if (search_filter && search_filter.trim()) {
        const searchTerm = search_filter.toLowerCase().trim();
        const summary = (eventData.summary || '').toLowerCase();
        const description = (eventData.description || '').toLowerCase();
        const location = (eventData.location || '').toLowerCase();

        const matchesSearch =
          summary.includes(searchTerm) ||
          description.includes(searchTerm) ||
          location.includes(searchTerm);

        if (!matchesSearch) {
          return [];
        }
      }

      if (exclude_all_day) {
        const isAllDay = eventData.start?.date && !eventData.start?.dateTime;
        if (isAllDay) {
          return [];
        }
      }

      return [eventData];
    } else {
      return [];
    }
  },

  async test(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { event_types, search_filter, exclude_all_day } = context.propsValue;

    const latestEvent = await getLatestEvent(
      context.propsValue.calendar_id!,
      auth
    );

    if (event_types && event_types.length > 0) {
      const eventType = latestEvent.eventType || 'default';
      if (!event_types.includes(eventType)) {
        return [];
      }
    }

    if (search_filter && search_filter.trim()) {
      const searchTerm = search_filter.toLowerCase().trim();
      const summary = (latestEvent.summary || '').toLowerCase();
      const description = (latestEvent.description || '').toLowerCase();
      const location = (latestEvent.location || '').toLowerCase();

      const matchesSearch =
        summary.includes(searchTerm) ||
        description.includes(searchTerm) ||
        location.includes(searchTerm);

      if (!matchesSearch) {
        return [];
      }
    }

    if (exclude_all_day) {
      const isAllDay = latestEvent.start?.date && !latestEvent.start?.dateTime;
      if (isAllDay) {
        return [];
      }
    }

    return [latestEvent];
  },
});
