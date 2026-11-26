import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchCampaigns, reachinboxCommon } from '../common/index';
import { ReachinboxAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const startCampaign = createAction({
  auth: ReachinboxAuth,
  name: 'startCampaign',
  classification: 'WRITE',
  displayName: 'Start Campaign',
  description: 'Starts or resumes sending for a campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts (launches or resumes) a ReachInbox campaign, identified by its campaign id, so it begins sending. Use to activate outreach for a campaign. Idempotent: starting an already-running campaign leaves it running.',
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
              value: campaign.id,
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

    if (!campaignId) {
      throw new Error('Campaign ID is required.');
    }

    const url = `${reachinboxCommon.baseUrl}campaigns/start`;

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
