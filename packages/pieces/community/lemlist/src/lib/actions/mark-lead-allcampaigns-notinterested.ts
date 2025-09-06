import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

interface Campaign {
  _id: string;
  name: string;
}

export const markLeadInAllCampaignsAsNotInterested = createAction({
  name: 'mark_lead_all_campaigns_not_interested',
  displayName: 'Mark Lead as Not Interested in All Campaigns',
  description: 'Mark a lead as not interested in every campaign they exist in.',
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'Email address of the lead to mark as not interested.',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const campaignsResponse = await httpClient.sendRequest<Campaign[]>({
      method: HttpMethod.GET,
      url: 'https://api.lemlist.com/api/campaigns',
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
    });

    const campaigns = campaignsResponse.body ?? [];

    if (campaigns.length === 0) {
      return { success: false, message: 'No campaigns found in Lemlist.' };
    }

    const results = [];
    for (const campaign of campaigns) {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: `https://api.lemlist.com/api/campaigns/${campaign._id}/leads/${propsValue.email}/notInterested`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: '',
            password: auth as string,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        });

        results.push({
          campaign: campaign.name,
          status: 'success',
          response: response.body,
        });
      } catch (error) {
        results.push({
          campaign: campaign.name,
          status: 'failed',
          error: error,
        });
      }
    }

    return { success: true, results };
  },
});
