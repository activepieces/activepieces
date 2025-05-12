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
    campaign_id: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Filter by Campaign (leave empty to check all campaigns)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest({
            endpoint: 'campaigns',
            method: HttpMethod.GET,
            apiKey: auth as string,
            queryParams: {
              limit: 100,
            },
          });

          if (!response || !response.items || !Array.isArray(response.items)) {
            return {
              disabled: true,
              placeholder: 'No campaigns found',
              options: [],
            };
          }

          return {
            options: response.items.map((campaign: any) => {
              return {
                label: campaign.name,
                value: campaign.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching campaigns',
            options: [],
          };
        }
      },
    }),
    list_id: Property.Dropdown({
      displayName: 'Lead List',
      description: 'Filter by Lead List (leave empty to check all lists)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest({
            endpoint: 'lead-lists',
            method: HttpMethod.GET,
            apiKey: auth as string,
          });

          if (!response || !response.items || !Array.isArray(response.items)) {
            return {
              disabled: true,
              placeholder: 'No lead lists found',
              options: [],
            };
          }

          return {
            options: response.items.map((list: any) => {
              return {
                label: list.name,
                value: list.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching lead lists',
            options: [],
          };
        }
      },
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

    // Set up endpoint and query params based on whether we're looking at a campaign or a list
    let endpoint;
    const queryParams: Record<string, string | number | boolean> = {
      created_after: lastFetchTime as string,
    };

    if (campaign_id) {
      endpoint = `campaigns/${campaign_id}/leads`;
    } else if (list_id) {
      endpoint = `leads/list/${list_id}/items`;
    } else {
      // If neither is specified, check all leads
      endpoint = 'leads';
    }

    // Fetch leads added since last check
    try {
      const response = await makeRequest({
        endpoint,
        method: HttpMethod.GET,
        apiKey: apiKey as string,
        queryParams,
      });

      if (!response.items || !Array.isArray(response.items)) {
        return [];
      }

      // Format and return leads
      return response.items.map((lead: any) => {
        return {
          id: lead.id,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          created_at: lead.timestamp_created,
          campaign_id: campaign_id || lead.campaign_id,
          list_id: list_id || lead.list_id,
          // Include other fields from the lead
          ...lead,
        };
      });
    } catch (error) {
      return [];
    }
  },
});
