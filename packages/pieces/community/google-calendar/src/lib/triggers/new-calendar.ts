import {
  createTrigger,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../../';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { getCalendars } from '../common/helper';
import { CalendarObject } from '../common/types';

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  Record<string, never> 
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, store }) => {
    
    const currentCalendars = await getCalendars(auth);
    const currentCalendarIds = currentCalendars.map((cal) => cal.id);

    
    const oldCalendarIds = (await store.get<string[]>('calendars')) || [];
    const oldCalendarIdsSet = new Set(oldCalendarIds);
    
    
    const newCalendars = currentCalendars.filter(
      (cal) => !oldCalendarIdsSet.has(cal.id)
    );

    
    await store.put('calendars', currentCalendarIds);

    
    return newCalendars.map((cal) => ({
      id: cal.id,
      data: cal,
    }));
  },
};

export const newCalendar = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_calendar',
  displayName: 'New Calendar',
  description: 'Fires when a new calendar is created.',
  props: {}, 
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'sample_calendar_id@group.calendar.google.com',
    summary: 'New Project Team Calendar',
    description: 'A shared calendar for the new project team.',
    timeZone: 'Asia/Kolkata',
    backgroundColor: '#9fe1e7',
    foregroundColor: '#000000',
    accessRole: 'owner',
  },

  async onEnable(context) {
    
    const calendars = await getCalendars(context.auth);
    await context.store.put(
      'calendars',
      calendars.map((cal) => cal.id)
    );
    
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async test(context) {
    
    const calendars = await getCalendars(context.auth);
    const recentCalendars = calendars.slice(-1);
    return recentCalendars.map((cal: CalendarObject) => ({ id: cal.id, data: cal }));
  },
});