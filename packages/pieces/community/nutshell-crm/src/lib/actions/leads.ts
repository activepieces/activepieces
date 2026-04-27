import { createAction, Property } from '@activepieces/pieces-framework';
import { nutshellAuth } from '../auth';
import { nutshellClient } from '../common/client';

const getLeadAction = createAction({
  auth: nutshellAuth,
  name: 'get_lead',
  displayName: 'Get Lead',
  description: 'Retrieve a lead by ID from Nutshell CRM',
  props: {
    leadId: Property.Number({
      displayName: 'Lead ID',
      description: 'The ID of the lead to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await nutshellClient.getLead(auth, propsValue.leadId);
  },
});

const createLeadAction = createAction({
  auth: nutshellAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Create a new lead in Nutshell CRM',
  props: {
    name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'Name of the lead',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes for the lead',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value (cents)',
      description: 'Expected value of the lead in cents',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const lead: Record<string, unknown> = {
      name: propsValue.name,
    };
    if (propsValue.description) lead.description = propsValue.description;
    if (propsValue.value) lead.value = { amount: propsValue.value, currency: 'USD' };
    return await nutshellClient.createLead(auth, lead);
  },
});

const updateLeadAction = createAction({
  auth: nutshellAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Update an existing lead in Nutshell CRM',
  props: {
    leadId: Property.Number({
      displayName: 'Lead ID',
      description: 'The ID of the lead to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'Updated name of the lead',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Updated description',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const lead: Record<string, unknown> = {};
    if (propsValue.name) lead.name = propsValue.name;
    if (propsValue.description) lead.description = propsValue.description;
    return await nutshellClient.updateLead(auth, propsValue.leadId, lead);
  },
});

const searchLeadsAction = createAction({
  auth: nutshellAuth,
  name: 'search_leads',
  displayName: 'Search Leads',
  description: 'Search for leads in Nutshell CRM',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to find leads',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results (default 25)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return await nutshellClient.searchLeads(auth, propsValue.query, propsValue.limit ?? 25);
  },
});

export { getLeadAction, createLeadAction, updateLeadAction, searchLeadsAction };
