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

export const addLeadToCampaign = createAction({
  name: 'add_lead_to_campaign',
  description: 'Adds a lead to a specific campaign.',
  displayName: 'Add Lead To Campaign',
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
      method: HttpMethod.POST,
      url: `https://api.lemlist.com/api/campaigns/${campaign}/leads`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: leadEmail,
      },
    });

    return { success: true };
  },
});
