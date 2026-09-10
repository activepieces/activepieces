import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vibeProspectingAuth } from '../auth';
import { exploriumApiCall, resolveApiKey } from '../common';

export const matchProspects = createAction({
  auth: vibeProspectingAuth,
  name: 'match_prospects',
  displayName: 'Match Prospects',
  description:
    'Match prospect attributes such as email or LinkedIn URL to Explorium prospect IDs',
  props: {
    prospects_to_match: Property.Json({
      displayName: 'Prospects To Match',
      description:
        'JSON array of prospect objects. Each item may include business_id, full_name, company_name, email, phone_number, and linkedin. Max 50 items.',
      required: true,
      defaultValue: [
        {
          email: 'hello@example.com',
          company_name: 'Example',
        },
      ],
    }),
  },
  async run({ auth, propsValue }) {
    return exploriumApiCall({
      apiKey: resolveApiKey(auth),
      method: HttpMethod.POST,
      path: '/v1/prospects/match',
      body: {
        prospects_to_match: propsValue.prospects_to_match,
      },
    });
  },
});
