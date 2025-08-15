import {
  createTrigger,
  TriggerStrategy,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../../';
import { googleCalendarCommon } from '../common';
import {
  stopWatchEvent,
  watchEvent,
  getLatestEvent,
} from '../common/helper';
import { GoogleWatchResponse } from '../common/types';

export const newEvent = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new event is created in a calendar.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
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

    
    if (headers['x-goog-resource-state'] === 'add') {
      
      return [payload.body];
    } else {
      return [];
    }
  },

  async test(context) {
    const auth = context.auth as OAuth2PropertyValue;

    
    const latestEvent = await getLatestEvent(
      context.propsValue.calendar_id!,
      auth
    );

    return [latestEvent];
  },
});