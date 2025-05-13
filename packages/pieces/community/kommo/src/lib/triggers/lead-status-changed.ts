import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

type KommoLead = {
  id: number;
  status_id: number;
  [key: string]: unknown;
};

export const leadStatusChangedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description: 'Triggered when a lead changes its pipeline stage/status.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 123456,
    status_id: 321,
  },
  async onEnable() {
    // Required for polling triggers — no cleanup needed at this time
  },
  async onDisable() {
    // Required for polling triggers — no cleanup needed at this time
  },
  async run(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const leads = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.GET,
      `/leads?limit=50&order=updated_at_desc`
    );

    const updatedLeads = leads._embedded.leads as KommoLead[];

    return updatedLeads.map((lead) => ({
      id: lead.id.toString(),
      data: lead,
    }));
  },
});
