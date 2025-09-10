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
  items: async ({ auth }) => {
    const { access_token: accessToken, location } = auth as any;
    const items = await zohoCampaignsCommon.listCampaigns({ accessToken, location });
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
  sampleData: {
    campaign_key: "f70c4878c4a47169407e63917ad24497",
    campaign_name: "Summer Newsletter 2024",
    created_date_string: "19 Aug 2024, 11:26 AM",
    campaign_status: "Draft",
    created_time: "1724065567000",
    campaign_preview: "https://campaigns.zoho.com/EmailDisplayAction.do?&campaignId=303000023454038"
  },
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
