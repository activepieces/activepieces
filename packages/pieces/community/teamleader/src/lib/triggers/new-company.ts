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

const props = {};

const polling: Polling<
  { access_token: string },
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.list',
      {
        updated_since: lastFetchEpochMS
          ? dayjs(lastFetchEpochMS).toISOString()
          : dayjs().subtract(1, 'day').toISOString(),
        status: 'active',
      }
    );
    return items.data.map((item: any) => ({
      epochMilliSeconds: dayjs(item.added_at).valueOf(),
      data: item,
    }));
  },
};

export const newCompany = createTrigger({
  auth: teamleaderAuth,
  name: 'newCompany',
  displayName: 'New Company',
  description: '',
  props,
  sampleData: {
    id: 'cde0bc5f-8602-4e12-b5d3-f03436b54c0d',
    name: 'Pied Piper',
    status: 'active',
    vat_number: 'BE0899623034',
    website: 'https://piedpiper.com',
    emails: [
      {
        type: 'primary',
        email: 'info@piedpiper.eu',
      },
    ],
    added_at: '2016-02-04T16:44:33+00:00',
    updated_at: '2016-02-05T16:44:33+00:00',
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
