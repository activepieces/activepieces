import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { woodpeckerAuth } from '../..';
import { campaignsDropdown, woodpeckerClient } from '../common';

export const getProspectResponses = createAction({
  auth: woodpeckerAuth,
  name: 'get_prospect_responses',
  displayName: 'Get Prospect Responses',
  description: 'Fetch all responses from a specified prospect',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the reply messages a given prospect has sent back, looked up by the prospect numeric ID and optionally narrowed to a single campaign. Use to read a prospect\'s replies for triage, sentiment, or logging. Read-only; safe to call repeatedly.', idempotent: true },
  props: {
    prospect_id: Property.Number({
      displayName: 'Prospect ID',
      description: 'The unique ID of the prospect',
      required: true,
    }),
    campaign_id: Property.Dropdown({
      displayName: 'Campaign',
      description: 'Filter responses by campaign (optional)',
      required: false,
      auth: woodpeckerAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const response = await httpClient.sendRequest<Array<{ id: number; name: string; status: string }>>({
          method: HttpMethod.GET,
          url: 'https://api.woodpecker.co/rest/v1/campaign_list',
          headers: {
            'x-api-key': (auth as { secret_text: string }).secret_text,
          },
        });
        const campaigns = response.body ?? [];
        return {
          disabled: false,
          options: campaigns.map((campaign) => ({
            label: `${campaign.name} (${campaign.status})`,
            value: campaign.id,
          })),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    
    if (propsValue.campaign_id) {
      queryParams['campaign_id'] = String(propsValue.campaign_id);
    }

    return await woodpeckerClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/v2/prospects/${propsValue.prospect_id}/responses`,
      undefined,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },
});
