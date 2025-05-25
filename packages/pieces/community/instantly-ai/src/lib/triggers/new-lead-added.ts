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
  QueryParams,
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
      const qs: QueryParams = {
        limit: isTest ? '10' : '100',
      };

      if (startingAfter) qs['starting_after'] = startingAfter;

      const response = (await makeRequest({
        endpoint: 'leads/list',
        method: HttpMethod.GET,
        apiKey: auth,
        queryParams: qs,
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
    timestamp: '2023-08-22T15:45:30.123Z',
    event_type: 'email_sent',
    campaign_name: 'Product Demo Campaign',
    workspace: 'workspace_123456',
    campaign_id: 'campaign_789012',
    lead_email: 'contact@example.com',
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Example Inc',
    website: 'example.com',
    phone: '+1234567890',
  },
});
