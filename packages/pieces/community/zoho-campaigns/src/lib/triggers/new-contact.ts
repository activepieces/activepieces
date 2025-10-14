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
  StaticPropsValue<any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { access_token: accessToken, location } = auth as any;
    const { listkey, status = 'active', sort = 'desc' } = propsValue;

    if (!listkey) {
      throw new Error('Mailing list is required');
    }

    const items = await zohoCampaignsCommon.listContacts({
      accessToken,
      location,
      listkey,
      status,
      sort,
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
  sampleData: {
    contact_email: 'john.doe@example.com',
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
