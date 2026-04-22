import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall, shapeCandidate, GreenhouseCandidate } from '../common';

export const findCandidateAction = createAction({
  name: 'find_candidate',
  displayName: 'Find Candidate',
  description: 'Searches for a candidate in Greenhouse by email address. Returns the first match.',
  auth: greenhouseAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to search for. Returns the first candidate whose profile contains this address.',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;

    const response = await greenhouseApiCall<GreenhouseCandidate[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      endpoint: '/candidates',
      queryParams: { email },
    });

    const candidates = Array.isArray(response.body) ? response.body : [];

    if (candidates.length === 0) {
      return { found: false };
    }

    return { found: true, ...shapeCandidate(candidates[0]) };
  },
});
