import {
  OAuth2PropertyValue,
  createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

import { hubSpotAuthentication } from '../common/props';
import { hubSpotClient } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues =
      (
        await hubSpotClient.searchTickets(auth.access_token, {
          createdAt: lastFetchEpochMS,
        })
      ).results ?? [];
    const items = currentValues.map((item: { createdAt: string }) => ({
      epochMilliSeconds: dayjs(item.createdAt).valueOf(),
      data: item,
    }));
    return items;
  },
};

export const newTicketAdded = createTrigger({
  name: 'new_ticket',
  auth: hubSpotAuthentication,
  displayName: 'New Ticket Added',
  description: 'Trigger when a new ticket is added.',
  props: {},
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store, propsValue, auth }) => {
    await pollingHelper.onEnable(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },
  onDisable: async ({ store, propsValue, auth }) => {
    await pollingHelper.onDisable(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },
  run: async ({ store, propsValue, auth }) => {
    return await pollingHelper.poll(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },
  test: async ({ store, propsValue, auth }) => {
    return await pollingHelper.test(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },

  sampleData: {},
});
