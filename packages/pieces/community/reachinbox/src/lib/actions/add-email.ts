import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const addEmail = createAction({
  auth: ReachinboxAuth,
  name: 'addEmail',
  classification: 'WRITE',
  displayName: 'Add Sending Account to Campaign',
  description: 'Lets a campaign send from one of your connected email accounts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Attaches a sending email address to a specific ReachInbox campaign so that account is used for outreach. Use to assign which connected mailbox a campaign sends from. Requires both a campaign id and the email address.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sending',
      display: 'section',
      label: 'Sending Account',
      icon: 'send',
      props: ['campaignId', 'email'],
    },
  ],
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
              value: campaign.id,
            })),
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
    email: Property.ShortText({
      displayName: 'Account Email',
      description: 'An email account already connected in ReachInbox.',
      placeholder: 'sales@yourcompany.com',
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
          Authorization: `Bearer ${context.auth.secret_text}`,
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
