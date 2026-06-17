import {
  createTrigger,
  TriggerStrategy,
  Property,
  WebhookRenewStrategy,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import {
  googleCalendarCommon,
  googleCalendarAuth,
  GoogleCalendarAuthValue,
} from '../common';
import {
  stopWatchEvent,
  watchEvent,
  getLatestEvent,
  getInitialSyncToken,
  listEventsWithSyncToken,
} from '../common/helper';
import { GoogleWatchResponse, GoogleCalendarEvent } from '../common/types';

const WATCH_STORE_KEY = 'google_calendar_watch';
const SYNC_TOKEN_STORE_KEY = 'google_calendar_sync_token';
const SEEN_EVENT_IDS_STORE_KEY = 'google_calendar_seen_event_ids';
const SEEN_EVENT_IDS_LIMIT = 500;

type EventFilters = {
  event_types: string[] | undefined;
  search_filter: string | undefined;
  exclude_all_day: boolean | undefined;
};

function matchesFilters(
  event: GoogleCalendarEvent,
  { event_types, search_filter, exclude_all_day }: EventFilters
): boolean {
  if (event_types && event_types.length > 0) {
    const eventType = event.eventType || 'default';
    if (!event_types.includes(eventType)) {
      return false;
    }
  }

  if (search_filter && search_filter.trim()) {
    const searchTerm = search_filter.toLowerCase().trim();
    const summary = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const location = (event.location || '').toLowerCase();

    const matchesSearch =
      summary.includes(searchTerm) ||
      description.includes(searchTerm) ||
      location.includes(searchTerm);

    if (!matchesSearch) {
      return false;
    }
  }

  if (exclude_all_day) {
    const isAllDay = event.start?.date && !event.start?.dateTime;
    if (isAllDay) {
      return false;
    }
  }

  return true;
}

export const newEvent = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new event is created in a calendar.',
  aiMetadata: {
    description: 'Fires when a brand-new event is created in the selected calendar (not on edits or cancellations), via Google push notifications. Each fired item is the new event; can be narrowed by event type, a text search across title/description/location, and an option to skip all-day events.',
  },
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
  renewConfiguration: {
    strategy: WebhookRenewStrategy.CRON,
    cronExpression: '0 */12 * * *',
  },
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
    const auth = context.auth as GoogleCalendarAuthValue;

    const response = await watchEvent(calendarId, context.webhookUrl, auth);

    await context.store.put<GoogleWatchResponse>(WATCH_STORE_KEY, response);

    const initialSyncToken = await getInitialSyncToken({
      calendarId,
      authProp: auth,
    });
    if (!isNil(initialSyncToken)) {
      await context.store.put<string>(SYNC_TOKEN_STORE_KEY, initialSyncToken);
    }
  },

  async onDisable(context) {
    const auth = context.auth as GoogleCalendarAuthValue;
    const watch = await context.store.get<GoogleWatchResponse>(
      WATCH_STORE_KEY
    );

    if (watch) {
      await stopWatchEvent(watch, auth);
    }
    await context.store.delete(SYNC_TOKEN_STORE_KEY);
    await context.store.delete(SEEN_EVENT_IDS_STORE_KEY);
  },

  async onRenew(context) {
    const calendarId = context.propsValue.calendar_id!;
    const auth = context.auth as GoogleCalendarAuthValue;

    const existingWatch = await context.store.get<GoogleWatchResponse>(
      WATCH_STORE_KEY
    );
    if (existingWatch) {
      await stopWatchEvent(existingWatch, auth);
    }

    const renewed = await watchEvent(calendarId, context.webhookUrl, auth);
    await context.store.put<GoogleWatchResponse>(WATCH_STORE_KEY, renewed);
  },

  async run(context) {
    const payload = context.payload;
    const headers = payload.headers as Record<string, string>;
    const resourceState = headers['x-goog-resource-state'];
    const filters: EventFilters = {
      event_types: context.propsValue.event_types,
      search_filter: context.propsValue.search_filter,
      exclude_all_day: context.propsValue.exclude_all_day,
    };

    if (resourceState === 'sync') {
      return [];
    }

    if (resourceState !== 'exists') {
      return [];
    }

    const calendarId = context.propsValue.calendar_id!;
    const auth = context.auth as GoogleCalendarAuthValue;
    const syncToken = await context.store.get<string>(SYNC_TOKEN_STORE_KEY);
    if (isNil(syncToken)) {
      const fresh = await getInitialSyncToken({ calendarId, authProp: auth });
      if (!isNil(fresh)) {
        await context.store.put<string>(SYNC_TOKEN_STORE_KEY, fresh);
      }
      return [];
    }

    const { items, nextSyncToken, syncTokenInvalid } =
      await listEventsWithSyncToken({
        calendarId,
        syncToken,
        authProp: auth,
      });

    if (syncTokenInvalid) {
      const fresh = await getInitialSyncToken({ calendarId, authProp: auth });
      if (!isNil(fresh)) {
        await context.store.put<string>(SYNC_TOKEN_STORE_KEY, fresh);
      }
      return [];
    }

    if (!isNil(nextSyncToken)) {
      await context.store.put<string>(SYNC_TOKEN_STORE_KEY, nextSyncToken);
    }

    const seenIds = await context.store.get<string[]>(SEEN_EVENT_IDS_STORE_KEY);
    const seenSet = new Set(seenIds ?? []);
    const newEvents: GoogleCalendarEvent[] = [];
    for (const event of items) {
      if (!event.id || event.status === 'cancelled') {
        continue;
      }
      if (seenSet.has(event.id)) {
        continue;
      }
      seenSet.add(event.id);
      if (matchesFilters(event, filters)) {
        newEvents.push(event);
      }
    }
    if (seenSet.size !== (seenIds?.length ?? 0)) {
      const bounded = Array.from(seenSet).slice(-SEEN_EVENT_IDS_LIMIT);
      await context.store.put<string[]>(SEEN_EVENT_IDS_STORE_KEY, bounded);
    }

    return newEvents;
  },

  async test(context) {
    const auth = context.auth as GoogleCalendarAuthValue;
    const filters: EventFilters = {
      event_types: context.propsValue.event_types,
      search_filter: context.propsValue.search_filter,
      exclude_all_day: context.propsValue.exclude_all_day,
    };

    const latestEvent = await getLatestEvent(
      context.propsValue.calendar_id!,
      auth
    );

    if (!matchesFilters(latestEvent, filters)) {
      return [];
    }

    return [latestEvent];
  },
});
