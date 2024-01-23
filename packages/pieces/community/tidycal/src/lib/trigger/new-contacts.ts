import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { calltidycalapi } from '../common';
import { tidyCalAuth } from '../../';
import dayjs from 'dayjs';

export const tidycalnewcontact = createTrigger({
  auth: tidyCalAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  props: {},
  sampleData: {
    data: [
      {
        id: '1',
        email: 'john@doe.com',
        name: 'John Doe',
        created_at: '2022-01-01T00:00:00.000000Z',
        updated_at: '2022-01-01T00:00:00.000000Z',
      },
    ],
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await calltidycalapi<{
      data: {
        id: string;
        created_at: string;
      }[];
    }>(HttpMethod.GET, `contacts`, auth, undefined);

    const createdcontacts = currentValues.body;
    const contact = createdcontacts.data.filter((item) => {
      const created_at = dayjs(item.created_at);
      return created_at.isAfter(lastFetchEpochMS);
    });
    return contact.map((item) => {
      return {
        epochMilliSeconds: dayjs(item.created_at).valueOf(),
        data: item,
      };
    });
  },
};
