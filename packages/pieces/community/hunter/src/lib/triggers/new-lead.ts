import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { hunterAuth } from '../common/auth';
import { LeadService } from '../common/lead-service';

const polling: Polling<
  PiecePropValueSchema<typeof hunterAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const leadService = new LeadService(auth as string);
    const newLeads: any[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;
    
    const lastFetchDate = lastFetchEpochMS ? new Date(lastFetchEpochMS) : null;
    
    while (hasMore) {
      try {
        const filters = {
          limit,
          offset,
        };

        const response = await leadService.searchLeads(filters);
        const leads = response.data?.leads || [];
        
        if (leads.length === 0) {
          hasMore = false;
          break;
        }

        for (const lead of leads) {
          if (!lead.created_at) continue;
          
          const leadCreatedAt = new Date(lead.created_at);
          
          if (!lastFetchDate || leadCreatedAt > lastFetchDate) {
            newLeads.push({
              epochMilliSeconds: leadCreatedAt.getTime(),
              data: lead,
            });
          } else {
            hasMore = false;
            break;
          }
        }

        if (leads.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }

        if (offset > 10000) {
          hasMore = false;
        }

      } catch (error: any) {
        if (error.message?.includes('403')) {
          throw new Error('Access forbidden: You do not have permission to access leads.');
        }
        if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait before polling for more leads.');
        }
        if (error.message?.includes('400')) {
          throw new Error('Bad request: Please check your API configuration.');
        }
        
        console.error('Error fetching leads for new lead trigger:', error);
        hasMore = false;
      }
    }

    return newLeads.sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
  },
};

export const newLeadTrigger = createTrigger({
  auth: hunterAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Fires when a new lead is created in Hunter. Returns all the fields of the lead in the same format as the Get a Lead action.',
  props: {},
  sampleData: {
    id: 1,
    email: 'hoon@stripe.com',
    first_name: 'Jeremy',
    last_name: 'Hoon',
    position: null,
    company: 'Stripe',
    company_industry: null,
    company_size: null,
    confidence_score: null,
    website: 'stripe.com',
    country_code: null,
    source: null,
    linkedin_url: null,
    phone_number: null,
    twitter: null,
    sync_status: null,
    notes: null,
    sending_status: null,
    last_activity_at: null,
    last_contacted_at: null,
    verification: {
      date: '2021-01-01 12:00:00 UTC',
      status: 'deliverable'
    },
    leads_list: {
      id: 1,
      name: 'My leads list',
      leads_count: 2
    },
    created_at: '2021-01-01 12:00:00 UTC'
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
}); 