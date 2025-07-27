import {
  DedupeStrategy,
  Polling,
  httpClient,
  HttpMethod,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  StaticPropsValue,
  TriggerStrategy,
  Property,
  createTrigger,
} from '@activepieces/pieces-framework';
import { hunterAuth } from '../..';

/**
 * Polls the Hunter Leads endpoint and emits any new leads based on their
 * creation timestamp. The API returns leads sorted with the most recent
 * entries first; we deduplicate on the `created_at` field.
 */
const props = {
  /**
   * Maximum number of leads to retrieve on each poll. Hunter accepts values
   * between 1 and 1000 (default is 20). Keeping the limit small reduces
   * bandwidth and ensures quick polling. If omitted, 20 is used.
   */
  limit: Property.Number({
    displayName: 'Limit',
    description:
      'Number of leads to fetch per poll (between 1 and 1000). Defaults to 20.',
    required: false,
    defaultValue: 20,
    minimum: 1,
    maximum: 1000,
  }),
};

// Define the polling logic. It returns an array of items with epoch timestamps
// used by Activepieces to deduplicate events.
const polling: Polling<string, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const limit = propsValue.limit ?? 20;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.hunter.io/v2/leads',
      queryParams: {
        api_key: auth,
        limit: limit.toString(),
      },
    });
    const leads = response.body?.data?.leads ?? [];
    return leads.map((lead: any) => {
      const createdAt = lead.created_at || lead.createdAt || lead.createdAtUTC;
      return {
        epochMilliSeconds: createdAt
          ? Date.parse(createdAt)
          : Date.now(),
        data: lead,
      };
    });
  },
};

export const hunterNewLeadTrigger = createTrigger({
  auth: hunterAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is created in your Hunter account.',
  props,
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
