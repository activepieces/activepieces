import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { dripCommon } from '../common';
import { dripAuth } from '../../';

export const dripAddSubscriberToCampaign = createAction({
  auth: dripAuth,
  name: 'add_subscriber_to_campaign',
  description: 'Add a subscriber to a campaign (Email series)',
  displayName: 'Add a subscriber to a campaign',
  props: {
    account_id: dripCommon.account_id,
    campaign_id: Property.Dropdown({
      displayName: 'Email Series Campaign',
      refreshers: ['account_id'],
      required: true,
      options: async ({ auth, account_id }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please fill in API key first',
          };
        }
        if (!account_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select an account first',
          };
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${dripCommon.baseUrl(account_id as string)}/campaigns`,
          headers: {
            Authorization: `Basic ${Buffer.from(auth as string).toString(
              'base64'
            )}`,
          },
        };
        const response = await httpClient.sendRequest<{
          campaigns: { name: string; id: string }[];
        }>(request);
        const opts = response.body.campaigns.map((campaign) => {
          return { value: campaign.id, label: campaign.name };
        });
        if (opts.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'Please create an email series campaign',
          };
        }
        return {
          disabled: false,
          options: opts,
        };
      },
    }),
    subscriber: dripCommon.subscriber,
    tags: dripCommon.tags,
    custom_fields: dripCommon.custom_fields,
  },
  async run({ auth, propsValue }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${dripCommon.baseUrl(propsValue.account_id)}/campaigns/${
        propsValue.campaign_id
      }/subscribers`,
      body: {
        subscribers: [
          {
            email: propsValue.subscriber,
            tags: propsValue.tags,
            custom_fields: propsValue.custom_fields,
          },
        ],
      },
      headers: {
        Authorization: dripCommon.authorizationHeader(auth),
      },
      queryParams: {},
    };
    return await httpClient.sendRequest<Record<string, never>>(request);
  },
});
