import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const addEmail = createAction({
  auth: ReachinboxAuth,
  name: 'addEmail',
  displayName: 'Add Email',
  description: 'Add an email to a specific account.',
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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Enter the email address to add to the campaign.',
      required: true,
    }),
  },
  async run(context) {
    const { campaignId, email } = context.propsValue;

    if (!campaignId || !email) {
      throw new Error('Campaign ID and Email are required.');
    }

    const url = `${reachinboxCommon.baseUrl}campaigns/add-email`;

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
          email: email,
        },
      });

      if (response.status === 200) {
        return {
          success: true,
          message: response.body.message || 'Email added successfully.',
        };
      } else if (response.status === 404) {
        return {
          success: false,
          message:
            response.body.message ||
            'Campaign not found or no emails were added to the campaign.',
        };
      } else {
        throw new Error(`Failed to add email: ${response.body.message}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to add email: ${error.message}`);
    }
  },
});
