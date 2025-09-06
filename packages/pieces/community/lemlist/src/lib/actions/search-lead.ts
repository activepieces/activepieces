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

export const searchLead = createAction({
  name: 'search_lead',
  displayName: 'Search Lead',
  description: 'Look up a lead by email and campaign.',
  props: {
    auth: Property.ShortText({
      displayName: 'API Key / Password',
      required: true,
    }),
    leadEmail: Property.ShortText({
      displayName: 'Lead Email',
      required: true,
    }),
    campaign: Property.Dropdown<Campaign>({
      displayName: 'Select Campaign',
      required: false,
      refreshers: ['auth'],
      options: async ({
        auth,
      }): Promise<{ options: { label: string; value: Campaign }[] }> => {
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
            value: c,
          })),
        };
      },
    }),
  },

  async run({ propsValue }) {
    const auth = propsValue['auth'];
    const leadEmail = propsValue['leadEmail'];
    const campaign = propsValue['campaign'];

    let url: string;

    if (campaign) {
      url = `https://api.lemlist.com/api/campaigns/${campaign._id}/leads/${leadEmail}`;
    } else {
      url = `https://api.lemlist.com/api/leads/${leadEmail}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      lead: response.body,
    };
  },
});
