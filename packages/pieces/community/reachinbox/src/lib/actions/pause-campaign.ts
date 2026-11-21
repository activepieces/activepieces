import { createAction, Property } from '@activepieces/pieces-framework';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { fetchCampaigns, reachinboxCommon } from '../common/index';

// Define the structure of the pause response
interface PauseCampaignResponse {
  status: number;
  message: string;
}

export const pauseCampaign = createAction({
  auth: ReachinboxAuth,
  name: 'pauseCampaign',
  classification: 'WRITE',
  displayName: 'Pause Campaign',
  description: 'Stops a campaign from sending until it is started again.',
  audience: 'both',
  aiMetadata: {
    description:
      'Pauses a running ReachInbox campaign, identified by its campaign id, halting further sends. Use to temporarily stop outreach for a campaign. Idempotent: pausing an already-paused campaign leaves it paused.',
    idempotent: true,
  },
  props: {
    campaignId: Property.Dropdown({
  auth: ReachinboxAuth,
      displayName: 'Campaign',
      description: 'Your campaigns, newest first.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const campaigns = await fetchCampaigns(auth.secret_text);

          if (campaigns.length === 0) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No campaigns found. Create one in ReachInbox first.',
            };
          }
          return {
            options: campaigns.map((campaign) => ({
              label: reachinboxCommon.campaignLabel(campaign),
              value: campaign.id.toString(),
            })),
            disabled: false,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load campaigns. Check your connection.',
          };
        }
      },
    }),
  },
  async run(context) {
    const { campaignId } = context.propsValue;

    // Build the URL for pausing the campaign
    const url = `${reachinboxCommon.baseUrl}campaigns/pause`;

    // Make a POST request to pause the selected campaign
    try {
      const response = await httpClient.sendRequest<PauseCampaignResponse>({
        method: HttpMethod.POST,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${context.auth.secret_text}`,
        },
        body: {
          campaignId, // Pass the selected campaign ID in the request body
        },
      });

      if (response.body.status === 200) {
        return {
          success: true,
          message: response.body.message,
        };
      } else {
        throw new Error(`Failed to pause campaign: ${response.body.message}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Campaign not found or unable to pause.',
        };
      } else {
        throw new Error(`Failed to pause campaign: ${error.message}`);
      }
    }
  },
});
