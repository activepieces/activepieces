import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsContactOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof zohoCampaignsAuth>,
  { listkey: string | undefined }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { listkey } = propsValue;

    if (!listkey) {
      throw new Error('Mailing list is required');
    }

    const items = await zohoCampaignsApi.listContacts({
      auth,
      listkey,
      sort: 'desc',
    });

    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.added_time).valueOf(),
      data: item,
    }));
  },
};

export const newContactTrigger = createTrigger({
  auth: zohoCampaignsAuth,
  name: 'newContact',
  outputSchema: zohoCampaignsContactOutputSchema,
  classification: 'READ',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a selected mailing list.',
  aiMetadata: {
    description:
      'Fires when a new contact appears in the selected Zoho Campaigns mailing list, representing a newly added subscriber. Polls the list and emits each new contact record.',
  },
  props: {
    listkey: zohoCampaignsProps.listKey({ required: true }),
  },
  sampleData: {
    contact_email: 'john.doe@example.com',
    firstname: 'John',
    lastname: 'Doe',
    phone: '+1-555-123-4567',
    companyname: 'Acme Corp',
    zuid: '12345678',
    added_time: '1699123456789',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
