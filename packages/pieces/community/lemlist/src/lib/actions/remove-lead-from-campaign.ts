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

export const removeLeadFromCampaign = createAction({
  name: 'remove_lead_from_campaign',
  description: 'Removes a lead from a specific campaign.',
  displayName: 'Remove Lead From Campaign',
  props: {
    auth: Property.ShortText({
      displayName: 'API Key / Password',
      required: true,
    }),
    leadEmail: Property.ShortText({
      displayName: 'Lead Email',
      required: true,
    }),
    campaign: Property.Dropdown<string>({
      displayName: 'Select Campaign',
      required: true,
      refreshers: ['auth'],
      options: async ({
        auth,
      }): Promise<{ options: { label: string; value: string }[] }> => {
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
  },

  async run({ propsValue }) {
    const { auth, leadEmail, campaign } = propsValue;

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.lemlist.com/api/campaigns/${campaign}/leads/${leadEmail}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return { success: true };
  },
});
