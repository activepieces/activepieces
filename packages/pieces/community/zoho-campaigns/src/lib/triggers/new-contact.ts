import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    createTrigger,
    PiecePropValueSchema,
    StaticPropsValue,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

const polling: Polling<
  PiecePropValueSchema<typeof zohoCampaignsAuth>,
  StaticPropsValue<{ listkey: any }>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth: { access_token: accessToken }, propsValue }) => {
    // implement the logic to fetch the items
    const items = await zohoCampaignsCommon.listContacts({
      accessToken,
      listkey: propsValue.listkey,
      sort: 'desc',
    });
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.added_time).valueOf(),
      data: item,
    }));
  },
};

export const newContact = createTrigger({
  auth: zohoCampaignsAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a selected mailing list.',
  props: zohoCampaignsCommon.newContactProperties(),
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
