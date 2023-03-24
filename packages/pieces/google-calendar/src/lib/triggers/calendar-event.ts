import { createTrigger, OAuth2PropertyValue } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { googleCalendarCommon } from '../common';
import { getLatestEvent, stopWatchEvent, watchEvent } from '../common/helper';
import { GoogleWatchResponse } from '../common/types';

export const calendarEventChanged = createTrigger({
  // docs: https://developers.google.com/calendar/api/guides/push
  name: 'new_or_updated_event',
  displayName: 'New Or updated Event',
  description: 'Triggers when there is an event added or updated',
  props: {
    authentication: googleCalendarCommon.authentication,
    calendar_id: googleCalendarCommon.calendarDropdown,
  },
  sampleData: {
    kind: 'calendar#event',
    etag: "3350849506974000",
    id: "0nsfi5ttd2b17ac76ma2f37oi9",
    htmlLink: 'https://www.google.com/calendar/event?eid=kgjb90uioj4klrgfmdsnjsjvlgkm',
    summary: 'ap-event-test',
    created: "2023-02-03T11:36:36.000Z",
    updated: "2023-02-03T11:45:53.487Z",
    description: 'Sample description',
    status: 'canceled',
    creator: {
      email: 'test@test.com',
      self: true
    },
    organizer: {
      email: 'test@test.com',
      self: true
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
    iCalUID: "0nsfi5ttd2b17ac76ma2f37oi9@google.com",
    sequence: 1,
    attendees: [
      {
        email: 'attende@test.com',
        responseStatus: 'needsAction'
      },
      {
        email: 'test@test.com',
        organizer: true,
        self: true,
        responseStatus: 'accepted'
      },
    ],
    reminders: {
      useDefault: true
    },
    eventType: 'default',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const authProp: OAuth2PropertyValue = context.propsValue[
      'authentication'
    ] as OAuth2PropertyValue;

    const currentChannel = await context.store?.get<GoogleWatchResponse>('_trigger');
    if (currentChannel?.id) {
      await stopWatchEvent(currentChannel, authProp); // to avoid creating multiple watchers
    }
    const calendarId = context.propsValue['calendar_id']!;

    const channel = await watchEvent(calendarId, context.webhookUrl!, authProp);

    await context.store?.put<GoogleWatchResponse>('_trigger', channel);
  },
  async onDisable(context) {
    const authProp: OAuth2PropertyValue = context.propsValue[
      'authentication'
    ] as OAuth2PropertyValue;

    const googleChannel = await context.store?.get<GoogleWatchResponse>('_trigger');
    if (googleChannel?.id) await stopWatchEvent(googleChannel, authProp);
    await context.store?.put<GoogleWatchResponse | object>('_trigger', {});
  },
  async run(context) {
    const authProp: OAuth2PropertyValue = context.propsValue[
      'authentication'
    ] as OAuth2PropertyValue;
    const event = await getLatestEvent(
      context.propsValue['calendar_id']!,
      authProp,
    );
    return [event];
  },
});
