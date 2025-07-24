import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterIoAuth } from '../common/auth';
import { hunterIoApiCall } from '../common/client';
import { HunterLeadsResponse, leadsListDropdown } from '../common/props';

const TRIGGER_DATA_STORE_KEY = 'hunterio_new_lead_trigger_data';

export const newLeadCreatedTrigger = createTrigger({
  auth: hunterIoAuth,
  name: 'new_lead_created',
  displayName: 'New Lead',
  description: 'Fires when a new lead is created.',
  type: TriggerStrategy.POLLING,

  props: {
    leads_list_id: {
      ...leadsListDropdown,
      description: 'Optionally, select a leads list to watch for new leads.',
      required: false,
    },
  },

  async onEnable(context) {
    const { leads_list_id } = context.propsValue;

    const query: Record<string, string | number> = { limit: 100 };
    if (leads_list_id) {
      query['leads_list_id'] = leads_list_id as number;
    }

    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query,
    });

    const leads = response.data?.leads ?? [];
    const leadIds = leads.map((lead: { id: any }) => lead.id);

    await context.store.put(TRIGGER_DATA_STORE_KEY, leadIds);
  },

  async onDisable(context) {
    await context.store.delete(TRIGGER_DATA_STORE_KEY);
  },

  async run(context) {
    const { leads_list_id } = context.propsValue;
    const previousLeadIds =
      (await context.store.get<number[]>(TRIGGER_DATA_STORE_KEY)) ?? [];

    const query: Record<string, string | number> = { limit: 100 };
    if (leads_list_id) {
      query['leads_list_id'] = leads_list_id as number;
    }

    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query,
    });

    const currentLeads = response.data?.leads ?? [];
    const currentLeadIds = currentLeads.map((lead: { id: any }) => lead.id);

    await context.store.put(TRIGGER_DATA_STORE_KEY, currentLeadIds);

    const newLeads = currentLeads.filter(
      (lead: { id: number }) => !previousLeadIds.includes(lead.id)
    );

    return newLeads;
  },

  async test(context) {
    const { leads_list_id } = context.propsValue;

    const query: Record<string, string | number> = { limit: 5 };
    if (leads_list_id) {
      query['leads_list_id'] = leads_list_id as number;
    }

    const response = await hunterIoApiCall<HunterLeadsResponse>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/leads',
      query,
    });

    return response.data?.leads ?? [];
  },

  sampleData: {
    id: 1,
    email: 'alexis@reddit.com',
    first_name: 'Alexis',
    last_name: 'Ohanian',
    position: 'Cofounder',
    company: 'Reddit',
    company_industry: 'Internet & Telecom',
    company_size: '1001-5000',
    confidence_score: 97,
    website: 'reddit.com',
    country_code: 'US',
    source: 'https://example.com/about-us',
    linkedin_url: 'https://www.linkedin.com/in/alexisohanian',
    phone_number: '+14155551234',
    twitter: 'alexisohanian',
    sync_status: 'success',
    notes: 'Met at the conference.',
    sending_status: 'sent',
    last_activity_at: '2025-07-20T10:00:00.000Z',
    last_contacted_at: '2025-07-20T10:00:00.000Z',
    verification: {
      date: '2025-01-01T12:00:00.000Z',
      status: 'deliverable',
    },
    leads_list: {
      id: 1,
      name: 'My leads list',
      leads_count: 2,
    },
    created_at: '2025-07-24T10:00:00.000Z',
  },
});
