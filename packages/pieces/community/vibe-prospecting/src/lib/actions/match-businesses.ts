import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vibeProspectingAuth } from '../auth';
import { exploriumApiCall, resolveApiKey } from '../common';

export const matchBusinesses = createAction({
  auth: vibeProspectingAuth,
  name: 'match_businesses',
  displayName: 'Match Businesses',
  description:
    'Match business attributes such as name or domain to Explorium business IDs',
  props: {
    businesses_to_match: Property.Json({
      displayName: 'Businesses To Match',
      description:
        'JSON array of business objects. Each item may include name, domain, url, and linkedin_url. Max 50 items.',
      required: true,
      defaultValue: [
        {
          name: 'Explorium',
          domain: 'explorium.ai',
        },
      ],
    }),
  },
  async run({ auth, propsValue }) {
    return exploriumApiCall({
      apiKey: resolveApiKey(auth),
      method: HttpMethod.POST,
      path: '/v1/businesses/match',
      body: {
        businesses_to_match: propsValue.businesses_to_match,
      },
    });
  },
});
