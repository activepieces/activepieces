import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const newLeadAddedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'new_lead_added',
  displayName: 'New Lead Added',
  description: 'Triggers when a lead is added to a campaign or list',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Filter by Campaign ID (leave empty to check all campaigns)',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'Filter by List ID (leave empty to check all lists)',
      required: false,
    }),
  },
  sampleData: {
    id: "54321",
    email: "contact@example.com",
    first_name: "Jane",
    last_name: "Doe",
    company: "Example Corp",
    phone: "+1234567890",
    added_to: {
      type: "campaign",
      id: "12345",
      name: "Product Launch Campaign"
    },
    created_at: "2023-08-22T14:30:45Z"
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    // Store last check time when the trigger is enabled
    await context.store.put('lastFetchTime', new Date().toISOString());
  },
  onDisable: async (context) => {
    // Clear the stored timestamp when the trigger is disabled
    await context.store.delete('lastFetchTime');
  },
  run: async (context) => {
    const { campaign_id, list_id } = context.propsValue;
    const { auth: apiKey } = context;

    // Get last fetch time or use a default (24 hours ago)
    const lastFetchTime = await context.store.get('lastFetchTime') ||
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Update last fetch time for next run
    await context.store.put('lastFetchTime', new Date().toISOString());

    const queryParams: Record<string, string | number | boolean> = {
      created_after: lastFetchTime as string,
    };

    let endpoint: string;
    let sourceType: 'campaign' | 'list';
    let sourceName = '';

    if (campaign_id) {
      endpoint = `campaigns/${campaign_id}/leads`;
      sourceType = 'campaign';

      // Fetch campaign name
      try {
        const campaignResponse = await makeRequest({
          endpoint: `campaigns/${campaign_id}`,
          method: HttpMethod.GET,
          apiKey: apiKey as string,
        });

        if (campaignResponse && campaignResponse.name) {
          sourceName = campaignResponse.name;
        }
      } catch (error) {
        // Ignore error and continue without the name
      }
    } else if (list_id) {
      endpoint = `lead-lists/${list_id}/leads`;
      sourceType = 'list';

      // Fetch list name
      try {
        const listResponse = await makeRequest({
          endpoint: `lead-lists/${list_id}`,
          method: HttpMethod.GET,
          apiKey: apiKey as string,
        });

        if (listResponse && listResponse.name) {
          sourceName = listResponse.name;
        }
      } catch (error) {
        // Ignore error and continue without the name
      }
    } else {
      endpoint = 'leads';
      sourceType = 'list'; // Default
    }

    // Fetch leads created since last check
    const response = await makeRequest({
      endpoint,
      method: HttpMethod.GET,
      apiKey: apiKey as string,
      queryParams,
    });

    if (!response.leads || !Array.isArray(response.leads)) {
      return [];
    }

    // Format the response
    return response.leads.map((lead: any) => {
      return {
        id: lead.id,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        company: lead.company,
        phone: lead.phone,
        added_to: {
          type: sourceType,
          id: campaign_id || list_id || 'all',
          name: sourceName || 'All Leads'
        },
        created_at: lead.created_at,
        custom_attributes: lead.custom_attributes
      };
    });
  },
});
