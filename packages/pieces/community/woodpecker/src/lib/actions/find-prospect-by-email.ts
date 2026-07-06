import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { woodpeckerAuth } from '../..';
import { woodpeckerClient } from '../common';

export const findProspectByEmail = createAction({
  auth: woodpeckerAuth,
  name: 'find_prospect_by_email',
  displayName: 'Find Prospect by Email',
  description: 'Search for a prospect by their email address',
  audience: 'both',
  aiMetadata: { description: 'Look up prospects in Woodpecker by email address, optionally including the campaigns each prospect is enrolled in. Use to check whether a contact already exists or to fetch their stored details and IDs before another action. The email is matched as a search filter (may return more than one match); read-only and safe to call repeatedly.', idempotent: true },
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
