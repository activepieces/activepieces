import {
  createTrigger,
  TriggerStrategy,
  Property,
  PiecePropValueSchema,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<PiecePropValueSchema<typeof formStackAuth>, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const authentication = auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    // Fetch forms from Formstack
    const formsResponse = await makeRequest(
      accessToken,
      HttpMethod.GET,
      '/form.json'
    );
    // The API returns an object with a 'forms' array
    const items = formsResponse.submissions || [];

    // Filter forms created after lastFetchEpochMS
    const newItems = items.filter((item: any) => {
      const created = dayjs(item.created, 'YYYY-MM-DD HH:mm:ss');
      return created.valueOf() > (lastFetchEpochMS ?? 0);
    });

    return newItems.map((item: any) => ({
      epochMilliSeconds: dayjs(item.created, 'YYYY-MM-DD HH:mm:ss').valueOf(),
      data: item,
    }));
  },
};

export const newSubmission = createTrigger({
  auth: formStackAuth,
  name: 'newSubmission',
  displayName: 'New Submission',
  description:
    'Triggers when a new submission is received for a specific form.',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      required: true,
    }),
  },
  sampleData: {
    id: '1001',
    timestamp: '2007-01-01 01:01:01',
    user_agent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
    remote_addr: '127.0.0.1',
    payment_status: 'No Response',
    latitude: '39.9143631',
    longitude: '-86.0761059',
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
