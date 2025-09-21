import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { profileDropdown } from '../common/props';

export const updatedLead = createTrigger({
  auth: whatConvertsAuth,
  name: 'updated_lead',
  displayName: 'Updated Lead',
  description: 'Fires when an existing lead is updated.',
  props: {
    profile_id: profileDropdown({
        description: 'Select a profile to watch for updated leads. Leave blank to watch all profiles.'
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    "lead_id": 148099,
    "lead_type": "Phone Call",
    "date_created": "2025-09-20T16:21:22Z",
    "last_updated": "2025-09-21T13:30:00Z", 
    "quotable": "Yes",
    "quote_value": 500, 
    "sales_value": 750,
    "lead_source": "google",
    "contact_name": "Jeremy Helms",
  },

  async onEnable(context) {
    
    await context.store.put('lastPollTimestamp', new Date().toISOString());
  },

  async onDisable(context) {

    return;
  },

  async run(context) {
    const lastPollTimestamp = await context.store.get('lastPollTimestamp') as string;
    

    const leads = await getLeads(context.auth, context.propsValue);
    

    const updatedLeads = leads.filter(lead => {
        const lastUpdated = new Date(lead['last_updated']);
        const lastPoll = new Date(lastPollTimestamp);
        return lastUpdated > lastPoll;
    });


    await context.store.put('lastPollTimestamp', new Date().toISOString());

    return updatedLeads;
  },
});


const getLeads = async (auth: any, props: any): Promise<any[]> => {
    const params: Record<string, string> = { order: 'desc' }; 
    const profileId = props['profile_id'];

    if (profileId) {
        params['profile_id'] = String(profileId);
    }
    
    const response = await whatConvertsClient.getLeads(auth, params);
    return response.leads;
}