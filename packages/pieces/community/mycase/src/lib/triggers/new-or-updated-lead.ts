import {
  createTrigger,
  TriggerStrategy,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { MyCaseClient } from '../common';

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const client = new MyCaseClient(auth);
    
    // Fetch leads updated since last poll
    const params: Record<string, unknown> = {};
    if (lastFetchEpochMS) {
      params.updated_since = new Date(lastFetchEpochMS).toISOString();
    }
    
    const leads = await client.findLead(params) as any;

    const items = Array.isArray(leads) ? leads : (leads?.data || []);
    
    return items.map((lead: any) => ({
      epochMilliSeconds: lead.updated_at ? new Date(lead.updated_at).getTime() : Date.now(),
      data: lead,
    }));
  },
};

export const newOrUpdatedLeadTrigger = createTrigger({
  auth: mycaseAuth,
  name: 'new_or_updated_lead',
  displayName: 'New or Updated Lead',
  description: 'Fires when a lead has been added or updated',
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  sampleData: {
    id: '12345',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
});

