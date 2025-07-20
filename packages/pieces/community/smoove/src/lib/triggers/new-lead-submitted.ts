import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { smooveApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const LAST_LEAD_IDS_KEY = 'smoove-last-lead-ids';

export const newLeadSubmitted = createTrigger({
  auth: smooveAuth,
  name: 'new_lead_submitted',
  displayName: 'New Lead Submitted',
  description: 'Fires when a lead is submitted via form, popup, or mobile campaign.',
  type: TriggerStrategy.POLLING,

  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new lead submissions.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
  },

  async onEnable(context) {
    const leads = await smooveApiCall<any[]>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/Leads',
    });

    const leadIds = leads.map((lead) => String(lead.id));
    await context.store.put<string[]>(LAST_LEAD_IDS_KEY, leadIds);

    console.log(`Initialized with ${leadIds.length} leads`);
  },

  async onDisable() {
    console.log('Smoove New Lead Submitted trigger disabled');
  },

  async run(context) {
    const previousIds = (await context.store.get<string[]>(LAST_LEAD_IDS_KEY)) || [];

    const leads = await smooveApiCall<any[]>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/Leads',
    });

    const currentIds = leads.map((lead) => String(lead.id));
    await context.store.put<string[]>(LAST_LEAD_IDS_KEY, currentIds);

    const newLeads = leads.filter((lead) => !previousIds.includes(String(lead.id)));

    return newLeads.map((lead) => ({
      id: String(lead.id),
      email: lead.email,
      name: lead.name || '',
      phone: lead.phone || '',
      submittedAt: lead.createdAt || new Date().toISOString(),
      source: lead.source || 'unknown',
      rawLeadData: lead,
      triggerInfo: {
        detectedAt: new Date().toISOString(),
        source: 'smoove',
        type: 'new_lead_submitted',
      },
    }));
  },

  async test(context) {
    const leads = await smooveApiCall<any[]>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/Leads',
    });

    const lead = leads?.[0];
    if (!lead) throw new Error('No leads found to test');

    return [
      {
        id: String(lead.id),
        email: lead.email,
        name: lead.name || '',
        phone: lead.phone || '',
        submittedAt: lead.createdAt || new Date().toISOString(),
        source: lead.source || 'unknown',
        rawLeadData: lead,
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'smoove',
          type: 'new_lead_submitted',
        },
      },
    ];
  },

  sampleData: {
    id: '67890',
    email: 'test@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    submittedAt: '2025-07-20T09:00:00.000Z',
    source: 'Form',
    triggerInfo: {
      detectedAt: new Date().toISOString(),
      source: 'smoove',
      type: 'new_lead_submitted',
    },
  },
});
