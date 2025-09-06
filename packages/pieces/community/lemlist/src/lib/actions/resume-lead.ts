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

export const resumeLead = createAction({
  name: 'resume_lead',
  description: 'Resume a lead’s outreach across all or specific campaigns.',
  displayName: 'Resume Lead From Campaign(s)',
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
      displayName: 'Select Campaign (optional)',
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
    const { auth, leadEmail, campaign } = propsValue;

    if (campaign) {
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.lemlist.com/api/campaigns/${campaign._id}/resume/${leadEmail}`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: '',
          password: auth as string,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.lemlist.com/api/leads/${leadEmail}/resume`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: '',
          password: auth as string,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return { success: true };
  },
});
