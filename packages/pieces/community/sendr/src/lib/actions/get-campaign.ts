import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { campaignDropdown, sendrApiCall, flattenObject } from '../common';

export const getCampaign = createAction({
  auth: sendrAuth,
  name: 'get_campaign',
  displayName: 'Get Campaign',
  description: 'Returns detailed information about a specific campaign.',
  audience: 'both',
  aiMetadata: { description: 'Fetches full details of a single campaign by its id. Use it after List Campaigns to inspect one campaign. Read-only; requires the campaign id.', idempotent: true },
  props: {
    campaign: campaignDropdown,
  },
  async run(context) {
    const response = await sendrApiCall<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/campaigns/${context.propsValue.campaign}`,
    });
    return flattenObject(response.body);
  },
});
