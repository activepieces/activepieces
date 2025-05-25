import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';
const polling: Polling<
  PiecePropValueSchema<typeof instantlyAiAuth>,
  Record<string, any>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const result = [];
    const isTest = lastFetchEpochMS === 0;
    let startingAfter: string | undefined = undefined;
    let hasMore = true;

    do {
      const body: Record<string, any> = {
        limit: isTest ? 10 : 100,
      };

      if (startingAfter) body['starting_after'] = startingAfter;

      const response = (await makeRequest({
        endpoint: 'leads/list',
        method: HttpMethod.POST,
        apiKey: auth,
        body,
      })) as {
        next_starting_after?: string;
        items: { timestamp_created: string }[];
      };

      const items = response.items || [];
      result.push(...items);

      if (isTest) break;

      startingAfter = response.next_starting_after;
      hasMore = !!startingAfter && items.length > 0;
    } while (hasMore);

    return result.map((lead) => {
      return {
        epochMilliSeconds: dayjs(lead.timestamp_created).valueOf(),
        data: lead,
      };
    });
  },
};

export const newLeadAddedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'new_lead_added',
  displayName: 'New Lead Added',
  description: 'Triggers when a new lead is added to a campaign',
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'd1f61dbc-bcb2-44fb-86b8-3d01c8701fe9',
    timestamp_created: '2025-05-25T12:50:04.748Z',
    timestamp_updated: '2025-05-25T13:00:52.019Z',
    organization: '31ef9f6c-00f0-481f-b309-95694ed324bb',
    status: 1,
    email_open_count: 0,
    email_reply_count: 0,
    email_click_count: 0,
    company_domain: 'test@gmail.com',
    status_summary: {},
    campaign: 'd228fc8f-44f2-42f3-b63f-3667dafc24cf',
    email: 'test@gmail.com',
    payload: {
      email: 'test@gmail.com',
      lastTouch: null,
      leadOwner: 'Test',
      leadSource: 'manual',
    },
    uploaded_by_user: '7f74fadd-b96b-4011-a1da-9b81a5bed165',
    upload_method: 'manual',
    assigned_to: '7f74fadd-b96b-4011-a1da-9b81a5bed165',
    esp_code: 1,
  },
});
