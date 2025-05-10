import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { instantlyAiAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const campaignStatusChangedTrigger = createTrigger({
  auth: instantlyAiAuth,
  name: 'campaign_status_changed',
  displayName: 'Campaign Status Changed',
  description: 'Triggers when a campaign changes status (e.g., from paused to active)',
  props: {
    status: Property.StaticDropdown({
      displayName: 'New Status',
      description: 'The status to trigger on (leave empty to trigger on any status change)',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Completed', value: 'completed' },
          { label: 'Draft', value: 'draft' },
        ],
      },
    }),
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Filter by Campaign ID (leave empty to trigger for all campaigns)',
      required: false,
    }),
  },
  sampleData: {
    id: "12345",
    name: "Product Launch Campaign",
    status: "active",
    previous_status: "paused",
    changed_at: "2023-08-22T14:30:45Z"
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
    const { status, campaign_id } = context.propsValue;
    const { auth: apiKey } = context;

    // Get last fetch time or use a default (24 hours ago)
    const lastFetchTime = await context.store.get('lastFetchTime') ||
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Update last fetch time for next run
    await context.store.put('lastFetchTime', new Date().toISOString());

    const queryParams: Record<string, string | number | boolean> = {
      updated_after: lastFetchTime as string,
    };

    if (campaign_id) {
      queryParams['id'] = campaign_id;
    }

    const endpoint = 'campaigns';

    // Fetch campaigns updated since last check
    const response = await makeRequest({
      endpoint,
      method: HttpMethod.GET,
      apiKey: apiKey as string,
      queryParams,
    });

    if (!response.campaigns || !Array.isArray(response.campaigns)) {
      return [];
    }

    // Filter campaigns that have changed status since last check
    const statusChangedCampaigns = response.campaigns.filter((campaign: any) => {
      if (!campaign.status_history || campaign.status_history.length < 2) {
        return false;
      }

      // Check if the most recent status change is after the last fetch time
      const latestStatusChange = campaign.status_history[0];
      if (new Date(latestStatusChange.timestamp) <= new Date(lastFetchTime as string)) {
        return false;
      }

      // Filter by specific new status if provided
      if (status && campaign.status !== status) {
        return false;
      }

      return true;
    });

    // Format the response
    return statusChangedCampaigns.map((campaign: any) => {
      const currentStatus = campaign.status;
      const previousStatus = campaign.status_history[1]?.status || 'unknown';
      const changedAt = campaign.status_history[0]?.timestamp;

      return {
        id: campaign.id,
        name: campaign.name,
        status: currentStatus,
        previous_status: previousStatus,
        changed_at: changedAt,
      };
    });
  },
});
