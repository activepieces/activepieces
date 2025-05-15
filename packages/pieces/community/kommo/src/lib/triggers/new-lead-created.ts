import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common/index';
import { HttpMethod } from '@activepieces/pieces-common';

type KommoLead = {
  id: number;
  name?: string;
  status_id?: number;
  [key: string]: unknown;
};

export const newLeadCreatedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'new_lead_created',
  displayName: 'New Lead Created',
  description: 'Triggered when a new lead is created in Kommo.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 123456,
    name: 'Sample Lead',
    status_id: 142,
  },
  async onEnable() {
    // Required for polling triggers — no setup needed at this time
  },

  async onDisable() {
    // Required for polling triggers — no cleanup needed at this time
  },

  async run(context) {
    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const leads = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.GET,
      `/leads?limit=25&order=created_at_desc`
    );

    return (leads._embedded.leads as KommoLead[]).map((lead) => ({
      id: lead.id.toString(),
      data: lead,
    }));
  },
});
