import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { profileDropdown } from '../common/props';

export const newLead = createTrigger({
  auth: whatConvertsAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Fires when a new lead is received.',
  props: {
    profile_id: profileDropdown({
        description: 'Select a profile to watch for new leads. Leave blank to watch all profiles.'
    }),
    lead_type: Property.StaticDropdown({
        displayName: 'Lead Type',
        description: 'Optionally, filter by a specific lead type.',
        required: false,
        options: {
          options: [
            { label: 'Phone Call', value: 'phone_call' },
            { label: 'Web Form', value: 'web_form' },
            { label: 'Chat', value: 'chat' },
            { label: 'Appointment', value: 'appointment' },
            { label: 'Email', value: 'email' },
            { label: 'Event', value: 'event' },
            { label: 'Text Message', value: 'text_message' },
            { label: 'Transaction', value: 'transaction' },
            { label: 'Other', value: 'other' },
          ],
        },
      }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "lead_id": 148099,
    "lead_type": "Phone Call",
    "lead_status": "Repeat",
    "date_created": "2025-09-21T16:21:22Z",
    "quotable": "Yes",
    "quote_value": 251,
    "sales_value": 750,
    "lead_source": "google",
    "lead_medium": "cpc",
    "lead_campaign": "call tracking general",
    "lead_url": "https://www.whatconverts.com/contact",
    "caller_name": "Jeremy Helms",
    "caller_number": "+15432245114",
    "contact_email_address": "hello@whatconverts.com",
  },

  async onEnable(context) {
    const leads = await getLeads(context.auth, context.propsValue);

    if (leads.length > 0) {
      await context.store.put('lastFetchedLeadId', leads[0]['lead_id']);
    }
  },

  async onDisable(context) {
    return;
  },

  async run(context) {
    const lastFetchedLeadId = await context.store.get('lastFetchedLeadId');
    const leads = await getLeads(context.auth, context.propsValue);
    
    const newLeads = [];
    for (const lead of leads) {
        if (lead['lead_id'] === lastFetchedLeadId) {
            break;
        }
        newLeads.push(lead);
    }

    if (newLeads.length > 0) {
        await context.store.put('lastFetchedLeadId', newLeads[0]['lead_id']);
    }
    
    return newLeads;
  },
});


const getLeads = async (auth: any, props: any): Promise<any[]> => {
    const params: Record<string, string> = { order: 'desc' }; 
    const profileId = props['profile_id'];
    const leadType = props['lead_type'];

    if (profileId) {
        params['profile_id'] = String(profileId);
    }
    if (leadType) {
        params['lead_type'] = String(leadType);
    }
    
    const response = await whatConvertsClient.getLeads(auth, params);
    return response.leads;
}