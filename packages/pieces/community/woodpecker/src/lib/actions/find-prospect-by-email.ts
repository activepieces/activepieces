import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { woodpeckerAuth } from '../..';
import { woodpeckerClient } from '../common';

export const findProspectByEmail = createAction({
  auth: woodpeckerAuth,
  name: 'find_prospect_by_email',
  displayName: 'Find Prospect by Email',
  description: 'Search for a prospect by their email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for (exact match or partial)',
      required: true,
    }),
    include_campaign_details: Property.Checkbox({
      displayName: 'Include Campaign Details',
      description: 'Include information about campaigns the prospect is enrolled in',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      search: `email=${propsValue.email}`,
    };

    if (propsValue.include_campaign_details) {
      queryParams['campaigns_details'] = 'true';
    }

    return await woodpeckerClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      '/v1/prospects',
      undefined,
      queryParams
    );
  },
});
