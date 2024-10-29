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
  displayName: 'Pause Campaign',
  description: 'Pause a selected campaign.',
  props: {
    campaignId: Property.Dropdown({
      displayName: 'Select Campaign',
      description: 'Choose a campaign to pause.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const campaigns = await fetchCampaigns(auth as string);

        return {
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: campaign.id.toString(),
          })),
          disabled: campaigns.length === 0,
        };
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
          Authorization: `Bearer ${context.auth as string}`,
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
