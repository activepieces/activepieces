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

export const updateLeadFromCampaign = createAction({
  name: 'update_lead_from_campaign',
  description:
    'Update lead fields (name, icebreaker, screenshot URL, etc.) in a campaign; supports enrichment flags.',
  displayName: 'Update Lead From Campaign',
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
      required: true,
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
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    icebreaker: Property.LongText({
      displayName: 'Icebreaker Text',
      required: false,
    }),
    screenshotUrl: Property.ShortText({
      displayName: 'Screenshot URL',
      required: false,
    }),
    enrich: Property.Checkbox({
      displayName: 'Enrich Lead',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ propsValue }) {
    const campaign = propsValue['campaign'];
    const leadEmail = propsValue['leadEmail'];
    const auth = propsValue['auth'];

    if (!campaign) {
      throw new Error('Campaign must be selected.');
    }

    const body: Record<string, string | boolean> = {};

    if (propsValue['firstName']) body['firstName'] = propsValue['firstName'];
    if (propsValue['lastName']) body['lastName'] = propsValue['lastName'];
    if (propsValue['icebreaker']) body['icebreaker'] = propsValue['icebreaker'];
    if (propsValue['screenshotUrl'])
      body['screenshotUrl'] = propsValue['screenshotUrl'];
    if (propsValue['enrich'] !== undefined)
      body['enrich'] = propsValue['enrich'];

    await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.lemlist.com/api/campaigns/${campaign._id}/leads/${leadEmail}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    return { success: true };
  },
});
