import { OAuth2PropertyValue } from '../../../framework/property';
import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { googleCalendarCommon } from '../common';
import { getLatestEvent, stopWatchEvent, watchEvent } from '../common/helper';
import { GoogleWatchResponse } from '../common/types';

export const calendarEventUpdatedOrCreatedOrDeleted = createTrigger({
  // docs: https://developers.google.com/calendar/api/guides/push
  name: 'new_event_added',
  displayName: 'New Event',
  description: 'Triggers when there is a new event added',
  props: {
    authentication: googleCalendarCommon.authentication,
    calendarId: googleCalendarCommon.calendarDropdown,
  },
  sampleData: {
    kind: 'calendar#event',
    htmlLink: 'https://www.google.com/calendar/event?eid=kgjb90uioj4klrgfmdsnjsjvlgkm',
    summary: 'ap-event-test',
    organizer: {
      email: 'test@test.com',
    },
    start: {
      dateTime: '2023-02-02T22:30:00+03:00',
      timeZone: 'Asia/Amman',
    },
    end: {
      dateTime: '2023-02-02T23:30:00+03:00',
      timeZone: 'Asia/Amman',
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
    const calendarId = context.propsValue['calendarId']!;

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
      context.propsValue['calendarId']!,
      authProp,
    );
    return [event];
  },
});
