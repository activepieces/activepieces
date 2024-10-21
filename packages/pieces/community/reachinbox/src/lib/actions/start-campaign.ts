import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const startCampaign = createAction({
  auth: ReachinboxAuth,
  name: 'startCampaign',
  displayName: 'Start Campaign',
  description: 'Starts a Campaign',
  props: {
    campaignId: Property.Dropdown({
      displayName: 'Select Campaign',
      description:
        'Choose a campaign from the list or enter the campaign ID manually.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const campaigns = await fetchCampaigns(auth as string);

        return {
          options: campaigns.map((campaign) => ({
            label: campaign.name,
            value: campaign.id,
          })),
          disabled: campaigns.length === 0,
        };
      },
    }),
  },
  async run(context) {
    const { campaignId } = context.propsValue;

    if (!campaignId) {
      throw new Error('Campaign ID is required.');
    }

    const url = `${reachinboxCommon.baseUrl}campaigns/start`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: url,
        headers: {
          Authorization: `Bearer ${context.auth as string}`,
          'Content-Type': 'application/json',
        },
        body: {
          campaignId: campaignId,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          message: response.body.message || 'Campaign started successfully.',
        };
      } else {
        throw new Error(`Failed to start campaign: ${response.body.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to start campaign: ${error.message}`);
    }
  },
});
