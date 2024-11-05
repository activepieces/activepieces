import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { weblingAuth } from '../../index';
import { weblingCommon } from '../common';
import { WeblingCalendarEvent } from '../common/types';
import { getUpdatedOrNewEvents } from '../common/helpers';

const polling: Polling<
  PiecePropValueSchema<typeof weblingAuth>,
  { calendarId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue: { calendarId }, lastFetchEpochMS }) => {
    // implement the logic to fetch the items
    const items: WeblingCalendarEvent[] =
      (await getUpdatedOrNewEvents(auth, calendarId!, lastFetchEpochMS)) ?? [];
    return items.map((item) => ({
      epochMilliSeconds: new Date(item.meta.lastmodified).getTime(),
      data: item,
    }));
  },
};

export const onEventChanged = createTrigger({
  auth: weblingAuth,
  name: 'onEventChanged',
  displayName: 'New or Updated Event',
  description: 'Triggers when an event is added or updated.',
  props: {
    calendarId: weblingCommon.calendarDropdown(),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendarId,
      },
    });
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendarId,
      },
    });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendarId,
      },
    });
  },

  async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, {
      store,
      auth,
      propsValue: {
        calendarId: propsValue.calendarId,
      },
    });
  },
});
