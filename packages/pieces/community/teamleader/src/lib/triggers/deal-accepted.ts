import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { stat } from 'fs';
const props = {};
// replace auth with piece auth variable
const polling: Polling<
  { access_token: string },
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    // implement the logic to fetch the items
    const items = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.list',
      {
        updated_since: lastFetchEpochMS
          ? dayjs(lastFetchEpochMS).toISOString()
          : dayjs().subtract(1, 'day').toISOString(),

        status: 'won', //deal accepted status
      }
    );
    return items.map((item: any) => ({
      epochMilliSeconds: dayjs(item.created_date).valueOf(),
      data: item,
    }));
  },
};

export const dealAccepted = createTrigger({
  auth: teamleaderAuth,
  name: 'dealAccepted',
  displayName: 'Deal Accepted',
  description: '',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
