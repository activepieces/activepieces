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

export const markLeadAsNotInterested = createAction({
  name: 'mark_lead_as_not_interested',
  displayName: 'Mark Lead as Not Interested',
  description: 'Mark a specific lead in a campaign as not interested.',
  props: {
    campaignId: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Select a campaign from Lemlist.',
      required: true,
      refreshers: [],
      async options({ auth }) {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Lemlist account first',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<Campaign[]>({
          method: HttpMethod.GET,
          url: 'https://api.lemlist.com/api/campaigns',
          authentication: {
            type: AuthenticationType.BASIC,
            username: '',
            password: auth as string,
          },
        });

        const campaigns = response.body ?? [];
        return {
          options: campaigns.map((c) => ({
            label: c.name,
            value: c._id,
          })),
        };
      },
    }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'Email address of the lead to mark as not interested.',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.lemlist.com/api/campaigns/${propsValue.campaignId}/leads/${propsValue.email}/notInterested`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return (
      response.body ?? {
        success: true,
        message: 'Lead marked as not interested',
      }
    );
  },
});
