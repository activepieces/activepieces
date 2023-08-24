import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../../';
import { googleCalendarCommon } from '../common';
import { getEvent } from '../common/helper';
import { GoogleCalendarEvent } from '../common/types';
export const upcomingEventTrigger = createTrigger({
  auth: googleCalendarAuth,
  name: 'upcoming_event',
  displayName: 'Upcoming Event / Reminder Trigger',
  description: 'Desc',
  type: TriggerStrategy.POLLING,
  sampleData: {
    kind: 'calendar#event',
    etag: '"3385750326932000"',
    id: '15ggq5ka3laoia10q4s2m3cku4',
    status: 'confirmed',
    htmlLink:
      'https://www.google.com/calendar/event?eid=MTVnZ3E1a2EzbGFvaWExMHE0czJtM2NrdTQgYXRvbG9naXN0Lmtpc2hhbnBAbQ',
    created: '2023-08-24T10:21:55.000Z',
    updated: '2023-08-24T11:06:03.466Z',
    summary: 'Testing Data',
    creator: {
      email: 'example@gmail.com',
      self: true,
    },
    organizer: {
      email: 'example@gmail.com',
      self: true,
    },
    start: {
      dateTime: '2023-08-24T16:45:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: '2023-08-24T17:00:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    iCalUID: '15ggq5ka3laoia10q4s2m3cku4@google.com',
    sequence: 3,
    reminders: {
      useDefault: true,
    },
    eventType: 'default',
  },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    event_id: googleCalendarCommon.eventDropdown(),
    minutes: Property.Number({
      displayName: 'Minutes',
      required: true,
      defaultValue: 5,
      // validators: [Validators.number, Validators.minValue(1)],
    }),
  },
  onEnable: async ({ auth, propsValue, setSchedule, store }) => {
    const { calendar_id, event_id, minutes } = propsValue;
    const event = await getEvent(
      auth,
      calendar_id as string,
      event_id as string
    );
    const startTime = new Date(event.start.dateTime);
    const timezone = event.start.timeZone;
    const reminderTime = new Date(startTime.getTime() - minutes * 60000);
    const cronDate = {
      mins: reminderTime.getMinutes(),
      hours: reminderTime.getHours(),
      dayOfMonth: reminderTime.getDate(),
      month: reminderTime.getMonth() + 1,
      dayOfWeek: reminderTime.getDay(),
    };
    const cronExpression = `${cronDate.mins} ${cronDate.hours} ${cronDate.dayOfMonth} ${cronDate.month} ${cronDate.dayOfWeek}`;
    store.put<GoogleCalendarEvent>('upcoming_event', event);
    setSchedule({
      cronExpression: cronExpression,
      timezone: timezone,
    });
  },
  async run(ctx): Promise<GoogleCalendarEvent[]> {
    let eventList: GoogleCalendarEvent[] = [];
    const event = await ctx.store.get<GoogleCalendarEvent>('upcoming_event');
    if (event) {
      eventList = [event];
    }
    return eventList;
  },
  onDisable: async (ctx) => {
    ctx.store.delete('upcoming_event');
  },
});
