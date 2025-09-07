import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth, baseApiUrl } from '../..';

export const campaignControl = createAction({
  auth:famulorAuth,
  name: 'campaignControl',
  displayName: 'Start/Stop Campaign',
  description: "Start or stop an outbound campaign from our platform.",
  props: {
    campaign: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Select a campaign',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const res = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: baseApiUrl + 'api/user/campaigns',
          headers: {
            Authorization: "Bearer " + auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (res.status !== 200) {
          return {
            disabled: true,
            placeholder: 'Error fetching campaigns',
            options: [],
          };
        } else if (res.body.length === 0) {
          return {
            disabled: true,
            placeholder: 'No campaigns found. Create one first.',
            options: [],
          };
        }

        return {
          options: res.body.map((campaign: any) => ({
            value: campaign.id,
            label: campaign.name,
          })),
        };
      }
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Select action to perform on the campaign',
      required: true,
      options: {
        options: [
          { label: 'Start Campaign', value: 'start' },
          { label: 'Stop Campaign', value: 'stop' }
        ]
      }
    })
  },
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: baseApiUrl + 'api/user/campaigns/update-status',
      body: {
        campaign_id: context.propsValue['campaign'],
        action: context.propsValue['action'],
      },
      headers: {
        Authorization: "Bearer " + context.auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });
    return res.body;
  },
});