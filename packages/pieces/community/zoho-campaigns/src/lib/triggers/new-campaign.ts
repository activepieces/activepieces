import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    createTrigger,
    PiecePropValueSchema,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

// replace auth with piece auth variable
const polling: Polling<
  PiecePropValueSchema<typeof zohoCampaignsAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth: { access_token: accessToken } }) => {
    const items = await zohoCampaignsCommon.listCampaigns({ accessToken });
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.created_date_string).valueOf(),
      data: item,
    }));
  },
};

export const newCampaign = createTrigger({
  auth: zohoCampaignsAuth,
  name: 'newCampaign',
  displayName: 'New Campaign',
  description: 'Fires when a new campaign is created.',
  props: {},
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
