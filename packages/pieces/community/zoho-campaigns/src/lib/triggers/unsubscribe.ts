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

// replace auth with piece auth variable
const polling: Polling<
  PiecePropValueSchema<typeof zohoCampaignsAuth>,
  StaticPropsValue<any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth: { access_token: accessToken }, propsValue }) => {
    const { listkey, status = 'unsub' } = propsValue;

    if (!listkey) {
      throw new Error('Mailing list is required');
    }

    const items = await zohoCampaignsCommon.listContacts({
      accessToken,
      listkey,
      sort: 'desc',
      status
    });
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.added_time).valueOf(),
      data: item,
    }));
  },
};

export const unsubscribe = createTrigger({
  auth: zohoCampaignsAuth,
  name: 'unsubscribe',
  displayName: 'Unsubscribe',
  description:
    'Fires when a contact is removed from a mailing list or unsubscribed.',
  props: zohoCampaignsCommon.unsubscribeProperties(),
  sampleData: {
    contact_email: 'unsubscribed@example.com',
    firstname: 'John',
    lastname: 'Doe',
    phone: '+1-555-123-4567',
    companyname: 'Acme Corp',
    zuid: '12345678',
    added_time: '1699123456789'
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
